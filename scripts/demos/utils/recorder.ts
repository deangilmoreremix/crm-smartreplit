import puppeteer, { Browser, Page } from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import fs from 'fs';
import path from 'path';
import GIFEncoder from 'gifencoder';
import { createCanvas, loadImage } from 'canvas';
import { PNG } from 'pngjs';

export interface RecorderOptions {
  width?: number;
  height?: number;
  fps?: number;
  quality?: number;
  outputDir?: string;
}

export class DemoRecorder {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private recorder: PuppeteerScreenRecorder | null = null;
  private options: Required<RecorderOptions>;
  private screenshotFrames: string[] = [];

  constructor(options: RecorderOptions = {}) {
    this.options = {
      width: options.width || 1280,
      height: options.height || 720,
      fps: options.fps || 30,
      quality: options.quality || 80,
      outputDir: options.outputDir || path.join(process.cwd(), 'demos/output'),
    };

    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  async initialize() {
    console.log('🚀 Launching browser...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        `--window-size=${this.options.width},${this.options.height}`,
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({
      width: this.options.width,
      height: this.options.height,
    });

    console.log('✅ Browser ready');
  }

  async startRecording(name: string) {
    if (!this.page) throw new Error('Page not initialized');

    const videoPath = path.join(this.options.outputDir, `${name}.mp4`);
    
    this.recorder = new PuppeteerScreenRecorder(this.page, {
      fps: this.options.fps,
      videoFrame: {
        width: this.options.width,
        height: this.options.height,
      },
    });

    await this.recorder.start(videoPath);
    console.log(`📹 Recording started: ${name}`);
  }

  async stopRecording() {
    if (this.recorder) {
      await this.recorder.stop();
      console.log('⏹️  Recording stopped');
      this.recorder = null;
    }
  }

  async navigate(url: string) {
    if (!this.page) throw new Error('Page not initialized');
    console.log(`🌐 Navigating to ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    await this.wait(1000); // Wait for animations
  }

  async wait(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async click(selector: string, waitAfter: number = 500) {
    if (!this.page) throw new Error('Page not initialized');
    console.log(`🖱️  Clicking: ${selector}`);
    await this.page.click(selector);
    await this.wait(waitAfter);
  }

  async type(selector: string, text: string, waitAfter: number = 500) {
    if (!this.page) throw new Error('Page not initialized');
    console.log(`⌨️  Typing in ${selector}: ${text}`);
    await this.page.type(selector, text, { delay: 50 });
    await this.wait(waitAfter);
  }

  async scroll(distance: number, duration: number = 1000) {
    if (!this.page) throw new Error('Page not initialized');
    console.log(`📜 Scrolling ${distance}px`);
    
    const steps = Math.ceil(duration / 16); // 60fps
    const stepDistance = distance / steps;
    
    for (let i = 0; i < steps; i++) {
      await this.page.evaluate((step) => {
        window.scrollBy(0, step);
      }, stepDistance);
      await this.wait(16);
    }
  }

  async hover(selector: string, waitAfter: number = 300) {
    if (!this.page) throw new Error('Page not initialized');
    console.log(`👆 Hovering: ${selector}`);
    await this.page.hover(selector);
    await this.wait(waitAfter);
  }

  async captureScreenshot(name: string) {
    if (!this.page) throw new Error('Page not initialized');
    const screenshotPath = path.join(this.options.outputDir, 'frames', `${name}.png`);
    
    if (!fs.existsSync(path.dirname(screenshotPath))) {
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    }
    
    await this.page.screenshot({ path: screenshotPath });
    this.screenshotFrames.push(screenshotPath);
    return screenshotPath;
  }

  async convertToGIF(name: string, deleteFrames: boolean = true): Promise<string> {
    if (this.screenshotFrames.length === 0) {
      throw new Error('No screenshots captured for GIF conversion');
    }

    console.log(`🎨 Converting ${this.screenshotFrames.length} frames to GIF...`);
    
    const gifPath = path.join(this.options.outputDir, `${name}.gif`);
    const encoder = new GIFEncoder(this.options.width, this.options.height);
    
    const stream = fs.createWriteStream(gifPath);
    encoder.createReadStream().pipe(stream);
    
    encoder.start();
    encoder.setRepeat(0); // Loop forever
    encoder.setDelay(1000 / this.options.fps); // Frame delay in ms
    encoder.setQuality(this.options.quality);

    for (const framePath of this.screenshotFrames) {
      const image = await loadImage(framePath);
      const canvas = createCanvas(this.options.width, this.options.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, this.options.width, this.options.height);
      encoder.addFrame(ctx);
    }

    encoder.finish();

    await new Promise((resolve) => {
      stream.on('finish', resolve);
    });

    console.log(`✅ GIF created: ${gifPath}`);

    // Cleanup frames
    if (deleteFrames) {
      for (const framePath of this.screenshotFrames) {
        fs.unlinkSync(framePath);
      }
      this.screenshotFrames = [];
    }

    return gifPath;
  }

  async close() {
    if (this.recorder) {
      await this.stopRecording();
    }
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser closed');
    }
  }

  getPage(): Page {
    if (!this.page) throw new Error('Page not initialized');
    return this.page;
  }
}

export async function createRecorder(options?: RecorderOptions): Promise<DemoRecorder> {
  const recorder = new DemoRecorder(options);
  await recorder.initialize();
  return recorder;
}
