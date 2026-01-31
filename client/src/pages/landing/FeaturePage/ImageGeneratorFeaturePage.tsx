import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { 
  Image, 
  Camera, 
  ChevronRight, 
  CheckCheck, 
  ArrowRight, 
  Play,
  Star,
  Palette,
  PencilRuler,
  Layout,
  Copy,
  Download,
  Check,
  FileText,
  Share2,
  Sparkles
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

const ImageGeneratorFeaturePage: React.FC = () => {
  return (
    <div className="bg-white">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-20 bg-gradient-to-b from-white to-emerald-50">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Generate <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">Professional Images</span> Instantly
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Create stunning, professional-quality images for sales presentations, proposals, and marketing materials in seconds with our DALL-E powered Image Generator.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
                  Start Free Trial
                </Link>
                <HashLink to="#examples" className="px-8 py-4 bg-white text-emerald-600 font-medium rounded-lg border border-emerald-200 hover:border-emerald-300 hover:shadow-md transition duration-300 flex items-center">
                  View Examples <ChevronRight size={18} className="ml-1" />
                </HashLink>
              </div>
              <div className="mt-8 flex items-center text-sm text-gray-500">
                <CheckCheck size={18} className="text-green-500 mr-2" />
                No credit card required
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 rounded-2xl blur-3xl opacity-20 transform rotate-3"></div>
                <img
                  src="https://images.pexels.com/photos/2977565/pexels-photo-2977565.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Image Generator UI"
                  className="relative rounded-xl shadow-2xl border border-gray-200 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Key Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Transform Your Visual Content</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create professional images for every sales and marketing need without design skills or expensive software.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-emerald-100 rounded-full w-min mb-4">
                <Camera className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Creation</h3>
              <p className="text-gray-600">
                Generate high-quality images in seconds just by describing what you want—no design skills required.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-teal-100 rounded-full w-min mb-4">
                <Palette className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Style Control</h3>
              <p className="text-gray-600">
                Choose from different artistic styles, layouts, and color schemes to match your brand and message perfectly.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-cyan-100 rounded-full w-min mb-4">
                <Layout className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Multiple Formats</h3>
              <p className="text-gray-600">
                Create images in various dimensions and aspect ratios, perfect for presentations, emails, social media, and more.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Examples Section */}
      <section id="examples" className="py-20 bg-gradient-to-b from-emerald-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Image Examples</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See the quality and versatility of our AI-generated images for various sales and marketing purposes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <img
                src="https://images.pexels.com/photos/5905480/pexels-photo-5905480.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Product showcase"
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">Product Showcase</span>
                <h3 className="mt-2 font-bold">Professional Product Visualization</h3>
                <p className="text-sm text-gray-600 mt-1">Perfect for showcasing your products in professional settings and various environments.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <img
                src="https://images.pexels.com/photos/6476589/pexels-photo-6476589.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Infographic"
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-full">Data Visualization</span>
                <h3 className="mt-2 font-bold">Engaging Infographics</h3>
                <p className="text-sm text-gray-600 mt-1">Transform data into visually appealing graphics that tell a compelling story.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <img
                src="https://images.pexels.com/photos/6476254/pexels-photo-6476254.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Presentation background"
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2.5 py-0.5 rounded-full">Presentation</span>
                <h3 className="mt-2 font-bold">Presentation Backgrounds</h3>
                <p className="text-sm text-gray-600 mt-1">Create professional, branded backgrounds for your sales presentations.</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <Link to="/ai-tools/image-generator" className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              Generate Your Own Images <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Creating professional images has never been easier. Just follow these simple steps:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Describe Your Image</h3>
              <p className="text-gray-600">
                Enter a detailed description of the image you want to create. The more specific you are, the better the results.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Select Options</h3>
              <p className="text-gray-600">
                Choose your preferred style, dimensions, and quality settings for the perfect result.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Generate & Download</h3>
              <p className="text-gray-600">
                Generate your image and download it for immediate use in your presentations, emails, or marketing materials.
              </p>
            </div>
          </div>
          
          <div className="mt-12 max-w-5xl mx-auto bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-8 border border-emerald-100">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/2 mb-6 md:mb-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Watch the Image Generator in Action</h3>
                <p className="text-gray-600 mb-4">
                  See how easy it is to create stunning images for your sales and marketing needs.
                </p>
                <button className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <Play size={18} className="mr-2" />
                  Watch Demo
                </button>
              </div>
              <div className="w-full md:w-1/2 md:pl-8">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-emerald-600 text-white p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <Camera size={18} className="mr-2" />
                      <span className="font-medium">Image Generator</span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="border-dashed border-2 border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                      <Camera size={36} className="text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm text-center">Click to watch the demo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Advanced Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our Image Generator goes beyond basic image creation with powerful features for professional use.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-md flex items-start">
              <div className="p-3 bg-emerald-100 rounded-full mr-4">
                <PencilRuler className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Customization Options</h3>
                <p className="text-gray-600 mb-3">Adjust styles, layouts, colors, and more to match your brand identity perfectly.</p>
                <ul className="space-y-1">
                  <li className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Multiple style options (professional, modern, minimal)</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Custom aspect ratios (square, landscape, portrait)</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0" />
                    <span>HD quality for professional presentations</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md flex items-start">
              <div className="p-3 bg-emerald-100 rounded-full mr-4">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Content Types</h3>
                <p className="text-gray-600 mb-3">Generate a wide variety of visual content for different sales uses.</p>
                <ul className="space-y-1">
                  <li className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Product visualizations and mockups</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Comparison charts and diagrams</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Custom presentation slides and backgrounds</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md flex items-start">
              <div className="p-3 bg-emerald-100 rounded-full mr-4">
                <Download className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Export Options</h3>
                <p className="text-gray-600 mb-3">Flexible export formats make it easy to use your images anywhere.</p>
                <ul className="space-y-1">
                  <li className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0" />
                    <span>High-resolution PNG and JPG downloads</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Direct save to your CRM's content library</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Email and presentation optimized formats</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md flex items-start">
              <div className="p-3 bg-emerald-100 rounded-full mr-4">
                <Share2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Collaboration Tools</h3>
                <p className="text-gray-600 mb-3">Share and collaborate on image creation with your team.</p>
                <ul className="space-y-1">
                  <li className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Save and share image prompts with your team</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Create branded image templates</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Maintain image libraries for team access</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">From Our Customers</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how sales teams are using our Image Generator to enhance their presentations and materials.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                <img 
                  src="https://images.pexels.com/photos/5792641/pexels-photo-5792641.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt="Testimonial from Jennifer Lee" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="text-yellow-400 fill-yellow-400" size={20} />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">
                  "The Image Generator has been a game-changer for our sales presentations. We've cut design costs by 70% and can now create custom visuals for each client meeting in minutes. The quality is professional enough that clients often ask who our designer is!"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">Jennifer Lee</p>
                  <p className="text-gray-500">Sales Director, Novus Technologies</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Transform Your Sales Visuals Today
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
              Join thousands of sales professionals who are creating stunning visuals in seconds with our AI Image Generator.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="px-8 py-4 bg-white text-emerald-700 font-medium rounded-lg hover:shadow-lg transition duration-300">
                Start Your Free Trial
              </Link>
              <Link to="/ai-tools" className="px-8 py-4 bg-emerald-500 bg-opacity-30 hover:bg-opacity-40 text-white font-medium rounded-lg transition-colors">
                Explore All AI Tools
              </Link>
            </div>
            <p className="mt-4 opacity-80">No credit card required</p>
          </div>
        </div>
      </section>
      
      <LandingFooter />
    </div>
  );
};

export default ImageGeneratorFeaturePage;