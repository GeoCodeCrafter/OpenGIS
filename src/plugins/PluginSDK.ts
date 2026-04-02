import type { PluginManifest, PluginHook } from '@/types/plugin';

export interface RegisteredPlugin {
  manifest: PluginManifest;
  hooks: Partial<Record<PluginHook, (...args: unknown[]) => unknown>>;
  active: boolean;
}

/**
 * Plugin SDK — manages plugin lifecycle and hook dispatch.
 */
class PluginSDK {
  private plugins: Map<string, RegisteredPlugin> = new Map();

  /**
   * Register a plugin from its manifest and module.
   */
  register(
    manifest: PluginManifest,
    hooks: Partial<Record<PluginHook, (...args: unknown[]) => unknown>> = {},
  ): void {
    if (this.plugins.has(manifest.id)) {
      console.warn(`Plugin "${manifest.id}" is already registered.`);
      return;
    }

    this.plugins.set(manifest.id, { manifest, hooks, active: false });
  }

  /**
   * Activate a registered plugin.
   */
  activate(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    plugin.active = true;
    this.dispatchHook('onActivate', pluginId);
    return true;
  }

  /**
   * Deactivate a plugin.
   */
  deactivate(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    this.dispatchHook('onDeactivate', pluginId);
    plugin.active = false;
    return true;
  }

  /**
   * Unregister a plugin entirely.
   */
  unregister(pluginId: string): void {
    this.deactivate(pluginId);
    this.plugins.delete(pluginId);
  }

  /**
   * Get all registered plugins.
   */
  getAll(): RegisteredPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all active plugins.
   */
  getActive(): RegisteredPlugin[] {
    return this.getAll().filter((p) => p.active);
  }

  /**
   * Dispatch a hook to all active plugins that implement it.
   */
  dispatchHook(hook: PluginHook, ...args: unknown[]): unknown[] {
    const results: unknown[] = [];
    for (const plugin of this.getActive()) {
      const handler = plugin.hooks[hook];
      if (handler) {
        try {
          results.push(handler(...args));
        } catch (err) {
          console.error(`Plugin "${plugin.manifest.id}" hook "${hook}" error:`, err);
        }
      }
    }
    return results;
  }

  /**
   * Dispatch a hook that can transform a value through a chain.
   * Each plugin receives the output of the previous one.
   */
  dispatchChainHook<T>(hook: PluginHook, initialValue: T): T {
    let value = initialValue;
    for (const plugin of this.getActive()) {
      const handler = plugin.hooks[hook] as ((v: T) => T) | undefined;
      if (handler) {
        try {
          value = handler(value);
        } catch (err) {
          console.error(`Plugin "${plugin.manifest.id}" chain hook "${hook}" error:`, err);
        }
      }
    }
    return value;
  }
}

export const pluginSDK = new PluginSDK();
