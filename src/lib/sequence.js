export default class Sequence {
  /**
   * @param {string} seqString input sequence
   * @param {string} [name] name for FASTA format output
   */
  constructor (seqString, name) {
    seqString = seqString.toUpperCase()
    const invalidChar =
      seqString.split('').filter(
        c => !this.constructor.AVAILABLE_DICT.has(c))
    if (invalidChar.length) {
      throw new Error('Invalid characters encountered: ' + invalidChar)
    }
    this.seq_ = seqString
    this.name_ = name || ''
  }

  get seq () {
    return this.seq_
  }

  get name () {
    return this.name_
  }

  get fastaSeq () {
    return '>' + this.name_ + '\n' + this.seq + '\n'
  }

  get revCompSeq () {
    return this.seq_.split('').reverse()
      .map(c => this.constructor.REV_COMP_MAP.get(c)).join('')
  }

  get revCompFastaSeq () {
    return '>' + (this.name_ ? 'Reverse compliment of ' + this.name_ : '') +
      '\n' + this.revCompSeq + '\n'
  }

  get length () {
    return this.seq_.length
  }

  /**
   * @returns {number} GC content (0~1)
   */
  get gcContent () {
    if (this.seq_.match(/[ATCG]/i)) {
      return parseFloat((this.seq_.match(/[CG]/ig) || []).length) /
        (this.seq_.match(/[ATCG]/ig) || []).length
    }
    return 0.0
  }

  slice (beginIndex, endIndex) {
    if (typeof endIndex !== 'number' || endIndex > this.length) {
      endIndex = this.length
    }
    beginIndex = beginIndex || 0
    if (beginIndex < 0) {
      beginIndex = this.length + beginIndex
    }
    if (endIndex < 0) {
      endIndex = this.length + endIndex
    }
    if (beginIndex > this.length) {
      beginIndex = this.length
    }
    let nameStem = this.name_
    let offset = 0
    if (nameStem) {
      const match = nameStem.match(/(.*?)\s*\(([0-9]+), *[0-9]+\)/)
      if (match) {
        offset = parseInt(match[2])
        nameStem = match[1]
      }
    }
    return new Sequence(this.seq_.slice(beginIndex, endIndex),
      this.name_
        ? nameStem + ' (' + (beginIndex + offset) + ', ' +
          (endIndex + offset) + ')' : null)
  }
}

Sequence.AVAILABLE_STRING = 'ACGTN'
Sequence.AVAILABLE_DICT = new Set(Sequence.AVAILABLE_STRING.split(''))
Sequence.AVAILABLE_DEFINITIVE_STRING = 'ACGT'
Sequence.AVAILABLE_DEFINITIVE_DICT = new Set(
  Sequence.AVAILABLE_DEFINITIVE_STRING.split(''))
Sequence.REV_COMP_MAP = new Map()
Sequence.REV_COMP_MAP.set('A', 'T')
Sequence.REV_COMP_MAP.set('C', 'G')
Sequence.REV_COMP_MAP.set('G', 'C')
Sequence.REV_COMP_MAP.set('T', 'A')
Sequence.REV_COMP_MAP.set('N', 'N')
