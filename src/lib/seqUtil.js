import Sequence from './sequence'
import SeqTrie from './seqTrie'

/**
 * Use a sliding window to add all the n-mers to the seq trie
 * @param {Sequence} sequence The sequence used to populate the seq trie with a
 *    sliding window of its n-mers
 * @param {boolean} [isRevComp] Whether the reverse complement of the sequence
 *    is actually needed
 * @param {SeqTrie} [seqTrie] existing seq trie (if this is provided, length can
 *    be omitted)
 * @param {number} [length] length of the n-mer
 * @param {boolean} [countOccurance] whether the number of occurance is needed
 * @return {SeqTrie} the seq trie with all the n-mers
 */
function populateSeqTrie (
  sequence, isRevComp, seqTrie, length, countOccurance
) {
  seqTrie = seqTrie ||
    new SeqTrie(Sequence.AVAILABLE_DEFINITIVE_STRING, length, countOccurance)
  for (let i = 0; i <= sequence.length - seqTrie.length; i++) {
    const subSeq = sequence.slice(i, i + seqTrie.length)
    seqTrie.add(isRevComp ? subSeq.revCompSeq : subSeq.seq, subSeq.name)
  }
  return seqTrie
}

/**
 * @typedef {object} OffTarget Object to hold off-target related information.
 * @property {number} index the index where off-target happens (in the source)
 * @property {Array<string>} targets the target information (may include the
 * index if the target is sliced from a longer sequence)
 */

/**
 * @typedef {object} QuerySequence sequence used in queries
 * @property {Sequence} seq The sequence object
 * @property {number} startIndex The starting index of region
 * @property {number} endIndex The ending index (not included)
 */

/**
 * Find all potential off-targets
 * @param {Iterable<QuerySequence>} querySequences The primary sequences to look
 * for off-targets
 * @param {number} windowLength The length of the off-target window
 * @param {Iterable<Sequence>} targetSequences the target sequences to find
 * off-target from
 * @param {boolean} [isRevComp] Whether the reverse complement of the sequence
 * is actually needed. __*NOTICE*__ if `isRevComp` is set to `true`, the
 * `SeqTrie` will be populated with the rev-comp sequences of the reference
 * sequence. Therefore, if an existing `SeqTrie` is provided, it should also be
 * populated with rev-comp sequences as well.
 * @param {SeqTrie} [seqTrie] existing seq trie (if this is provided, length can
 * be omitted)
 * @param {boolean} [sameNameLocExclusion] if `isRevComp` === `false` and
 * `sequence.name` !== null, enabling this can prevent self at the same location
 * be marked as off-target.
 * @return {Array<Array<OffTarget>>} All matching off targets with names and
 * indices, in the same order as `querySequences`.
 */
function findOffTarget (
  querySequences, windowLength, targetSequences,
  isRevComp, seqTrie, sameNameLocExclusion
) {
  // populate local version of a seqTrie first
  let localSeqTrie = (seqTrie && seqTrie.getDeepCopy()) || null

  for (const sequence of targetSequences) {
    localSeqTrie = populateSeqTrie(
      sequence, isRevComp, localSeqTrie, windowLength, true)
  }

  const resultArray = []
  for (const querySequence of querySequences) {
    const startIndex = querySequence.startIndex || 0
    let endIndex = typeof querySequence.endIndex === 'number'
      ? querySequence.endIndex : querySequence.seq.length - windowLength + 1
    endIndex = Math.min(querySequence.seq.length - windowLength + 1, endIndex)
    const seqSpecificArray = []
    // then scan over the sliding window
    const extStartIndex = Math.max(0, startIndex - windowLength + 1)
    for (let i = extStartIndex; i < endIndex; i++) {
      const needleSeq = querySequence.seq.slice(i, i + windowLength)
      let resultAtIndex = localSeqTrie.hasEntry(needleSeq.seq)
      // exclude same name and loc if possible
      if (sameNameLocExclusion && needleSeq.name && !isRevComp) {
        resultAtIndex = resultAtIndex.filter(meta => meta !== needleSeq.name)
      }
      if (resultAtIndex.length) {
        seqSpecificArray.push({
          index: i,
          targets: resultAtIndex
        })
      }
    }
    resultArray.push(seqSpecificArray)
  }
  return resultArray
}

/**
 * @typedef {object} SequenceWithOffTargets sequence with potential off-targets
 * @property {string|Sequence} sequence
 * @property {Array<OffTarget>} offTargets
 */

/**
 * @callback SequenceCallback Callback functions taking a sequence as its param
 * @param {string|Sequence} sequence
 */

/**
 * Find all novel sequences with off-targets not greater than a given value (or
 * 0 if none given)
 * @param {number} length The length of the sequences to be generated
 * @param {string} prefix The prefix sequence
 * @param {string} suffix The suffix sequence
 * @param {number} tolerance How many off-targets is allowed
 * @param {Iterable<Sequence>} targetSequences the target sequences to find
 * off-target from
 * @param {boolean} [isRevComp] Whether the reverse complement of the sequence
 * is actually needed to calculate off-targets
 * @param {SeqTrie} [seqTrie] existing seq trie (if this is provided, window
 * length can be omitted)
 * @param {number} [windowLength] Window length to decide off-targets
 * @param {SequenceCallback} [seqCallback] Callback function used to handle when
 * an available sequence is ready
 * @return {Array<SequenceWithOffTargets>} All sequences with their
 * corresponding off target information.
 */
function findNovelSequence (
  length, prefix, suffix, tolerance, targetSequences,
  isRevComp, seqTrie, windowLength, seqCallback
) {
  let localSeqTrie = (seqTrie && seqTrie.getDeepCopy()) || null
  for (const sequence of targetSequences) {
    localSeqTrie = populateSeqTrie(
      sequence, isRevComp, localSeqTrie, windowLength, true)
  }
  return findNovelSequence_(
    length, prefix, suffix, tolerance, localSeqTrie, isRevComp, seqCallback)
}

/**
 * Internal function for finding all novel sequences with off-targets not
 * greater than a given value (or 0 if none given), all reference sequences have
 * been loaded onto the same seqTrie.
 *
 * Use DFS to search available sequences.
 *
 * @param {number} length The length of the sequences to be generated
 * @param {string} prefix The prefix sequence
 * @param {string} suffix The suffix sequence
 * @param {number} tolerance How many total off-targets is allowed
 * @param {SeqTrie} seqTrie existing seq trie
 * @param {boolean} [isRevComp] Whether the reverse complement of the sequence
 * is actually needed to calculate off-targets
 * @param {SequenceCallback} [seqCallback] Callback function used to handle when an
 * available sequence is ready
 * @return {Array<SequenceWithOffTargets>} All sequences with their
 * corresponding off target information.
 */
function findNovelSequence_ (
  length, prefix, suffix, tolerance, seqTrie, isRevComp, seqCallback
) {
  const result = []
  prefix = prefix || ''
  suffix = suffix || ''
  const windowLength = seqTrie.length
  // stack contains the following information: index and current base
  const stack = []
  let generatedSequence = ''
  let existingOffTargets = []

  // add potential prefix and suffix windows to the Trie
  const prefixSeq =
    new Sequence(prefix, 'Generated Sequence (0, ' + prefix.length + ')')
  populateSeqTrie(prefixSeq, isRevComp, seqTrie)

  const suffixSeq =
    new Sequence(suffix, 'Generated Sequence (' + (prefix.length + length) + ', ' + (prefix.length + length + suffix.length) + ')')
  populateSeqTrie(suffixSeq, isRevComp, seqTrie)

  let availableSet =
    seqTrie.getAvailableImmediateNextSet(prefix.slice(-windowLength + 1))
  const totalSet = Sequence.AVAILABLE_DEFINITIVE_DICT
  for (const nextBase of totalSet.keys()) {
    if (availableSet.has(nextBase) || tolerance > 0) {
      stack.push({ index: 0, currentBase: nextBase })
    }
  }

  while (stack.length) {
    const { index, currentBase } = stack.pop()
    // Remove populated entries in the Trie first
    const oldSeq = new Sequence(prefix + generatedSequence,
      'Generated Sequence (0' + 0 + ', ' +
      (prefix.length + generatedSequence.length) + ')')
    for (
      let oldIndex = index; oldIndex < generatedSequence.length; oldIndex++
    ) {
      const oldRealWindowStart = prefix.length + oldIndex - windowLength + 1
      if (oldRealWindowStart >= 0) {
        const oldSeqWindow = oldSeq.slice(oldRealWindowStart,
          oldRealWindowStart + windowLength)
        seqTrie.deleteEntry(
          isRevComp ? oldSeqWindow.revCompSeq : oldSeqWindow.seq,
          oldSeqWindow.name)
      }
    }
    generatedSequence = generatedSequence.slice(0, index)
    const realWindowStartIndex = prefix.length + index - windowLength + 1
    existingOffTargets = existingOffTargets.filter(
      offTarget => offTarget.index < realWindowStartIndex)
    if (index === length - 1) {
      // end of generated sequence, check last bit
      const sequenceToBeChecked =
        new Sequence(
          prefix + generatedSequence + currentBase + suffix,
          'Generated Sequence')
      const offTargets = findOffTarget(
        [{
          seq: sequenceToBeChecked,
          startIndex: prefix.length + index,
          endIndex: prefix.length + length
        }], windowLength,
        [sequenceToBeChecked.slice(
          Math.max(prefix.length - windowLength + 1, 0),
          Math.min(prefix.length + length + windowLength - 1,
            prefix.length + length + suffix.length
          )
        )], isRevComp, seqTrie, true)
      if (offTargets[0].length + existingOffTargets.length <= tolerance) {
        // this is a good candidate, push the last base in
        result.push({
          sequence: generatedSequence + currentBase,
          offTargets: existingOffTargets.concat(offTargets[0])
        })
        if (seqCallback) {
          seqCallback(generatedSequence + currentBase)
        }
      }
    } else {
      // check whether prefix + nextBase is already at windowLength
      if (prefix.length + index >= windowLength - 1) {
        // need to add to the trie, may need to add off-target here
        // check off-targets first
        const currWindowSequence =
          new Sequence((prefix + generatedSequence).slice(-(windowLength - 1)) +
            currentBase, 'Generated Sequence (' + realWindowStartIndex +
            ', ' + (realWindowStartIndex + windowLength) + ')')
        const potentialOffTarget = seqTrie.hasEntry(currWindowSequence)
        if (potentialOffTarget.length) {
          existingOffTargets.push({
            index: realWindowStartIndex,
            targets: potentialOffTarget
          })
        }
        seqTrie.add(isRevComp
          ? currWindowSequence.revCompSeq
          : currWindowSequence.seq,
        currWindowSequence.name)
      }
      // populate stack for further search
      generatedSequence += currentBase
      availableSet = seqTrie.getAvailableImmediateNextSet(
        (prefix + generatedSequence).slice(-(windowLength - 1)))
      for (const nextBase of totalSet) {
        if (
          availableSet.has(nextBase) || existingOffTargets.length < tolerance
        ) {
          stack.push({ index: index + 1, currentBase: nextBase })
        }
      }
    }
  }
  return result
}

export {
  findOffTarget,
  findNovelSequence,
  populateSeqTrie
}
