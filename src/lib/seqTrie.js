/**
 * @license
 * Copyright 2020 Xiaoyi Cao
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * @typedef {import('./sequence')} Sequence
 *
 * @class
 * Basic Trie function with a limited dictionary and a given length, supporting
 * CRD, looking for the immediate next element, looking for the immediate
 * available next element, looking whether the branch is saturated.
 *
 * @param {number} [length] a length used to calculate saturation
 * @param {boolean} [needsOccurence] whether the number of occurence is needed
 * @param {string} availableChars a string including all available characters
 */
export default class SeqTrie {
  /**
   */
  constructor (availableChars, length, needsOccurence) {
    // Verify whether the dictionary is corr
    if (!availableChars.length) {
      throw new Error('Available characters are not provided')
    }
    if (typeof length === 'number') {
      this.length_ = length
    } else {
      this.length_ = null
    }
    /**
     * Available characters
     * @instance
     * @type {Set<string>}
     */
    this.dict_ = new Set(availableChars.toUpperCase().split(''))
    /**
     * Available characters as a string for children constructors
     * @instance
     * @type {string}
     */
    this.dictString_ = [...this.dict_].join('')
    /**
     * The dictionary mapping the key to the next child Trie
     * @instance
     * @type {Map<string, SeqTrie>}
     */
    this.nextDic = new Map()
    /**
     * Whether the Trie is already saturated (all possible elements are filled)
     * @instance
     * @type {boolean}
     */
    this.saturated_ = length === 0
    /**
     * Record the meta data of all occurences for reference purposes, or null if
     * no occurence is needed.
     * @instance
     * @type {Array<object>|null}
     */
    this.occurence_ = needsOccurence ? [] : false
  }

  hasLength () {
    return typeof this.length_ === 'number'
  }

  get length () {
    return this.length_
  }

  /**
   * Verify if the entry's length is matching Trie's.
   * @param {string} entry
   */
  verifyLength (entry) {
    if (this.hasLength() && entry.length !== this.length) {
      throw new Error('Length does not match!')
    }
  }

  /**
   * Verify if the entry's elements are all within the supported dictionary
   * @param {string} entry
   */
  verifyDictionary (entry) {
    const invalidChars =
      [...entry.toUpperCase()].map(c => !this.dict_.has(c) ? c : '').join('')
    if (invalidChars.length) {
      throw new Error('Invalid characters found: ' + invalidChars)
    }
  }

  /**
   * Add a new entry to the Trie
   * @param {string|Sequence} newEntry The new entry to be added into the trie
   * if not already added.
   * @param {object} [meta] additional meta data to be added to the list
   */
  add (newEntry, meta) {
    newEntry = newEntry.seq || newEntry.toUpperCase()
    this.verifyLength(newEntry)
    this.verifyDictionary(newEntry)
    this.add_(newEntry, meta)
  }

  /**
   * Add a new entry to the Trie
   * @param {string} newEntry The new validated entry
   * @param {object} [meta] additional meta data to be added to the list
   */
  add_ (newEntry, meta) {
    if (!newEntry) {
      if (Array.isArray(this.occurence_)) {
        this.occurence_.push(meta)
      } else {
        this.occurence_ = true
      }
      return
    }
    if (!Array.isArray(this.occurence_) && this.isSaturated()) {
      return
    }
    if (!this.nextDic.has(newEntry[0])) {
      this.nextDic.set(newEntry[0], new SeqTrie(
        this.dictString_,
        this.hasLength() ? this.length - 1 : null,
        Array.isArray(this.occurence_)))
    }
    this.nextDic.get(newEntry[0]).add_(newEntry.slice(1), meta)
    if (this.nextDic.size === this.dict_.size) {
      this.saturated_ = [...this.nextDic.values()].every(ch => ch.isSaturated())
    }
  }

  /**
   * Check whether the entry is already there
   * @param {string|Sequence} entry The new entry to be added into the trie if
   * not already added.
   * @returns {boolean|Array<object>} returns occurences if there, otherwise
   * just `true`/`false` to indicate whether the entry exists.
   */
  hasEntry (entry) {
    entry = entry.seq || entry.toUpperCase()
    this.verifyLength(entry)
    this.verifyDictionary(entry)
    return this.hasEntry_(entry)
  }

  /**
   * Check whether the entry is already there
   * @param {string} entry The new validated entry.
   * @returns {boolean|Array<object>}
   */
  hasEntry_ (entry) {
    // if this trie is already saturated then the entry must be there
    if (!Array.isArray(this.occurence_) && this.isSaturated()) {
      return true
    }
    if (!entry) {
      return Array.isArray(this.occurence_) ? this.occurence_.slice() : true
    }
    // try to see if the entry's first letter is already there
    entry = entry.toUpperCase()
    if (!this.nextDic.has(entry[0])) {
      return Array.isArray(this.occurence_) ? [] : false
    }
    return this.nextDic.get(entry[0]).hasEntry(entry.slice(1), true)
  }

  /**
   * Delete an entry from the trie
   * @param {string|Sequence} entry The new entry to be added into the trie if
   * not already added.
   * @param {object} [meta] additional meta data to be added to the list
   * @param {function(object, object): boolean} [comp] function to compare
   * whether two meta values are equal. Default is (a, b) => a === b
   * @returns {boolean} Whether the entry is really deleted
   */
  deleteEntry (entry, meta, comp) {
    entry = entry.seq || entry.toUpperCase()
    this.verifyLength(entry)
    this.verifyDictionary(entry)
    return this.deleteEntry_(entry, meta, comp)
  }

  /**
   * Delete an entry from the trie
   * @param {string} entry The new validated entry.
   * @param {object} [meta] additional meta data to be added to the list
   * @param {function(object, object): boolean} [comp] function to compare
   * whether two meta values are equal. Default is (a, b) => a === b
   * @returns {boolean} Whether the entry is really deleted
   */
  deleteEntry_ (entry, meta, comp) {
    comp = comp || ((a, b) => a === b)
    if (!this.hasEntry_(entry) || !this.hasEntry_(entry).length) {
      return false
    }
    if (!entry) {
      if (Array.isArray(this.occurence_)) {
        for (let i = 0; i < this.occurence_.length; i++) {
          if (comp(this.occurence_[i], meta)) {
            this.occurence_.splice(i, 1)
            return true
          }
        }
        return false
      } else {
        this.occurence_ = false
        return true
      }
    }
    // delete from child first
    if (!this.nextDic.get(entry[0]).deleteEntry_(entry.slice(1), meta, comp)) {
      return false
    }
    if (this.nextDic.get(entry[0]).isEmpty()) {
      this.nextDic.delete(entry[0])
    }
    this.saturated_ = false
    return true
  }

  getImmediateNextSet (entry) {
    if (this.hasLength && (this.length === 0 || this.length <= entry.length)) {
      return new Set()
    }
    if (!entry && this.hasLength && this.length > 0) {
      return new Set(this.nextDic.keys())
    }
    entry = entry.toUpperCase()
    if (!this.nextDic.has(entry[0])) {
      // not matching the current seq part so no immediate next.
      return new Set()
    }
    return this.nextDic.get(entry[0]).getImmediateNextSet(entry.slice(1))
  }

  getAvailableImmediateNextSet (entry) {
    if (this.hasLength && (this.length === 0 || this.length <= entry.length)) {
      return new Set()
    }
    if (!entry && this.hasLength && this.length > 0) {
      return new Set([...this.dict_.keys()].filter(
        key => !this.nextDic.has(key) || !this.nextDic.get(key).isSaturated()))
    }
    entry = entry.toUpperCase()
    if (!this.nextDic.has(entry[0])) {
      // not matching the current seq part so all immediate next is available.
      return new Set(this.dict_)
    }
    return this.nextDic.get(entry[0]).getAvailableImmediateNextSet(
      entry.slice(1))
  }

  isSaturated () {
    return this.hasLength() && (this.length_ === 0 || this.saturated_)
  }

  isEmpty () {
    if (this.hasLength() && this.length_ > 0) {
      return !this.nextDic.size
    } else {
      return !Array.isArray(this.occurence_) || !this.occurence_.length
    }
  }

  /**
   * gets a deep copy of self
   * @returns {SeqTrie}
   */
  getDeepCopy () {
    const newTrie =
      new SeqTrie(this.dictString_, this.length, Array.isArray(this.occurence_))
    if (Array.isArray(this.occurence_)) {
      newTrie.occurence_ = this.occurence_.slice()
    }
    newTrie.saturated_ = this.saturated_
    for (const key of this.nextDic.keys()) {
      newTrie.nextDic.set(key, this.nextDic.get(key).getDeepCopy())
    }
    return newTrie
  }
}
