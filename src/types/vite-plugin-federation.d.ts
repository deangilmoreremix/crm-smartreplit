declare module '@originjs/vite-plugin-federation' {
  import { Plugin } from 'vite';

  export interface VitePluginFederationOptions {
    /**
     * Modules that should be exposed by this container. When provided, property name is used as public name, otherwise public name is automatically inferred from request.
     */
    exposes?: Record<string, string>;

    /**
     * The filename of the container as relative path inside the `output.path` directory.
     */
    filename?: string;

    /**
     * Transform hook need to handle file types
     * default ['.js','.ts','.jsx','.tsx','.mjs','.cjs','.vue','.svelte']
     */
    transformFileTypes?: string[];

    /**
     * Options for library.
     */
    // library?: LibraryOptions

    /**
     * Shared modules
     */
    shared?: Record<string, any>;

    /**
     * Remote modules
     */
    remotes?: Record<string, string>;

    /**
     * Name of the federated module
     */
    name?: string;
  }

  /**
   * Vite plugin for Module Federation
   * @param options Federation options
   */
  export default function federation(options: VitePluginFederationOptions): Plugin;
}
