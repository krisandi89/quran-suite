/**
 * LRU (Least Recently Used) Cache implementation
 * Used for caching search results per query
 */
export class LRUCache<K, V> {
    private maxSize: number;
    private cache: Map<K, V>;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    /**
     * Get a value from cache
     * Moves the key to the end (most recently used)
     */
    get(key: K): V | undefined {
        if (!this.cache.has(key)) {
            return undefined;
        }
        // Move to end (most recently used)
        const value = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    /**
     * Set a value in cache
     * Evicts oldest entry if cache is full
     */
    set(key: K, value: V): void {
        // If key exists, delete first to update position
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        // Evict oldest if full
        else if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, value);
    }

    /**
     * Check if key exists
     */
    has(key: K): boolean {
        return this.cache.has(key);
    }

    /**
     * Clear the cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get current cache size
     */
    get size(): number {
        return this.cache.size;
    }
}

/**
 * Simple Map-based cache for verse details
 * Key format: "surah:ayah"
 */
export class VerseCache<V> {
    private maxSize: number;
    private cache: Map<string, V>;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    private makeKey(surah: number, ayah: number): string {
        return `${surah}:${ayah}`;
    }

    get(surah: number, ayah: number): V | undefined {
        return this.cache.get(this.makeKey(surah, ayah));
    }

    set(surah: number, ayah: number, value: V): void {
        const key = this.makeKey(surah, ayah);
        // Simple eviction: remove first entry if full
        if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    has(surah: number, ayah: number): boolean {
        return this.cache.has(this.makeKey(surah, ayah));
    }

    clear(): void {
        this.cache.clear();
    }
}
