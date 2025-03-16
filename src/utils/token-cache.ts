/**
 * TokenCache - A memory-efficient Least Recently Used (LRU) cache for storing token counts
 * 
 * This cache helps avoid repeated tokenization of the same text, improving performance
 * by caching token counts for text-model pairs. It uses an LRU (Least Recently Used)
 * eviction policy to maintain a bounded memory footprint.
 * 
 * This implementation uses a Map for O(1) lookups and a linked list structure to track
 * usage order for efficient LRU eviction.
 * 
 * @example
 * ```
 * const cache = new TokenCache(500); // Create cache with max 500 entries
 * const tokenCount = cache.get(text, 'gpt-4'); // Try to get from cache
 * if (tokenCount === undefined) {
 *   // Not in cache, calculate and store
 *   const newCount = tokenizer.countTokens(text);
 *   cache.set(text, 'gpt-4', newCount);
 * }
 * ```
 */
export class TokenCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private head: CacheNode | null = null;
  private tail: CacheNode | null = null;
  private cacheSize: number = 0;

  /**
   * Create a new token cache
   * @param maxSize Maximum number of entries to store before evicting the least recently used entries
   * @throws {Error} If maxSize is not a positive number
   */
  constructor(maxSize: number = 1000) {
    if (typeof maxSize !== 'number' || maxSize <= 0) {
      throw new Error('TokenCache maxSize must be a positive number');
    }
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get a cached token count
   * @param text The text to get the token count for
   * @param model The model used for tokenization (forms part of the cache key)
   * @returns The cached token count or undefined if not in cache
   */
  get(text: string, model: string): number | undefined {
    if (!text || !model) {
      return undefined;
    }

    const key = this.generateKey(text, model);
    const entry = this.cache.get(key);

    if (entry) {
      // Move to front of LRU list (most recently used)
      this.moveToFront(entry.node);
      return entry.value;
    }

    return undefined;
  }

  /**
   * Set a token count in the cache
   * @param text The text to set the token count for
   * @param model The model used for tokenization (forms part of the cache key)
   * @param count The token count to cache
   * @throws {Error} If count is not a non-negative number
   */
  set(text: string, model: string, count: number): void {
    if (!text || !model) {
      return;
    }

    if (typeof count !== 'number' || count < 0) {
      throw new Error('Token count must be a non-negative number');
    }

    const key = this.generateKey(text, model);

    // If already in cache, update value and move to front
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = count;
      this.moveToFront(entry.node);
      return;
    }

    // If cache is full, remove the least recently used item (tail of list)
    if (this.cacheSize >= this.maxSize) {
      this.removeLRU();
    }

    // Create new node and add to front of list
    const newNode = { key, prev: null, next: null };
    this.addToFront(newNode);
    
    // Add to cache
    this.cache.set(key, { value: count, node: newNode });
    this.cacheSize++;
  }

  /**
   * Clear the cache, removing all stored token counts
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.cacheSize = 0;
  }

  /**
   * Get the current number of entries in the cache
   * @returns The number of entries currently stored in the cache
   */
  size(): number {
    return this.cacheSize;
  }

  /**
   * Set a new maximum size for the cache
   * If the new size is smaller than the current cache size,
   * the least recently used entries will be removed immediately.
   * @param newMaxSize The new maximum size
   * @throws {Error} If newMaxSize is not a positive number
   */
  setMaxSize(newMaxSize: number): void {
    if (typeof newMaxSize !== 'number' || newMaxSize <= 0) {
      throw new Error('TokenCache maxSize must be a positive number');
    }

    this.maxSize = newMaxSize;

    // If the cache is now too large, trim it
    while (this.cacheSize > this.maxSize) {
      this.removeLRU();
    }
  }

  /**
   * Generate a cache key from text and model
   * For longer texts, a hash is generated to avoid excessive memory usage
   * @param text The text portion of the key
   * @param model The model portion of the key
   * @returns A string key for the cache
   * @private
   */
  private generateKey(text: string, model: string): string {
    // For very long texts, we use a hash of the text to avoid extremely long keys
    if (text.length > 100) {
      // Simple string hash function
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return `${model}:${hash}`;
    }

    return `${model}:${text}`;
  }

  /**
   * Add a node to the front of the linked list (most recently used)
   * @param node Node to add to the front
   * @private
   */
  private addToFront(node: CacheNode): void {
    // If list is empty
    if (!this.head) {
      this.head = node;
      this.tail = node;
      return;
    }

    // Add to front
    node.next = this.head;
    this.head.prev = node;
    this.head = node;
  }

  /**
   * Move a node to the front of the linked list (most recently used)
   * @param node Node to move to the front
   * @private
   */
  private moveToFront(node: CacheNode): void {
    // Already at front
    if (node === this.head) {
      return;
    }

    // Remove from current position
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
    if (node === this.tail) {
      this.tail = node.prev;
    }

    // Add to front
    node.prev = null;
    node.next = this.head;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;
  }

  /**
   * Remove the least recently used item (from the tail of the list)
   * @private
   */
  private removeLRU(): void {
    if (!this.tail) {
      return; // Empty list
    }

    // Remove from cache
    this.cache.delete(this.tail.key);
    
    // Remove from list
    if (this.head === this.tail) {
      // Only one item
      this.head = null;
      this.tail = null;
    } else {
      // More than one item
      this.tail = this.tail.prev;
      if (this.tail) {
        this.tail.next = null;
      }
    }
    
    this.cacheSize--;
  }
}

/**
 * Node in the LRU linked list
 * @private
 */
interface CacheNode {
  key: string;
  prev: CacheNode | null;
  next: CacheNode | null;
}

/**
 * Entry in the cache map
 * @private
 */
interface CacheEntry {
  value: number;
  node: CacheNode;
}
