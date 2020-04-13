/* eslint-env mocha */
import chai, { expect } from 'chai'
import dirtyChai from 'dirty-chai'
import Sequence from '../../src/lib/sequence.js'
// import SeqTrie from '../../src/lib/seqTrie.js'
import { findOffTarget/*, findNovelSequence */, populateSeqTrie, findNovelSequence } from '../../src/lib/seqUtil.js'

chai.use(dirtyChai)

describe('Sequence utility tests', () => {
  it('Find off-target from entire sequence (trivial case)', () => {
    const sequences = [
      new Sequence('aaaaa', 'test1'),
      new Sequence('ttttt', 'test2'),
      new Sequence('ccccc', 'test3'),
      new Sequence('ccggg', 'test4')
    ]
    const querySeq = new Sequence('gggcc', 'querySeq')

    expect(findOffTarget([{ seq: querySeq }], 3, sequences, false, null))
      .to.deep.equal([[{
        index: 0, targets: ['test4 (2, 5)']
      }]])
  })

  it('Find off-target from entire sequence (not-so-trivial case)', () => {
    const sequences = [
      new Sequence('cgatggatggtagtcag', 'test1'),
      new Sequence('tgtcgatgcatg', 'test2'),
      new Sequence('acatcgatgttagtg', 'test3')
    ]
    const querySeq = new Sequence('tgtagctagtcca', 'querySeq')

    expect(findOffTarget([{ seq: querySeq }], 4, sequences, false, null))
      .to.deep.equal([[{
        index: 1, targets: ['test1 (9, 13)']
      }, {
        index: 6, targets: ['test1 (10, 14)', 'test3 (10, 14)']
      }, {
        index: 7, targets: ['test1 (11, 15)']
      }]])
    expect(findOffTarget([{ seq: querySeq }], 3, sequences, false, null))
      .to.deep.equal([[
        { index: 0, targets: ['test2 (0, 3)', 'test3 (7, 10)'] },
        { index: 1, targets: ['test1 (9, 12)'] },
        { index: 2, targets: ['test1 (10, 13)', 'test3 (10, 13)'] },
        { index: 6, targets: ['test1 (10, 13)', 'test3 (10, 13)'] },
        { index: 7, targets: ['test1 (11, 14)', 'test3 (11, 14)'] },
        { index: 8, targets: ['test1 (12, 15)', 'test2 (1, 4)'] }]])
  })

  it('Find off-target, plus self', () => {
    const sequences = [
      new Sequence('cgatggatggtagtcag', 'test1'),
      new Sequence('tgtcgatgcatg', 'test2'),
      new Sequence('acatcgatgttagtg', 'test3')
    ]
    const querySeq = new Sequence('tgtagccctagcgtcca', 'querySeq')
    const seqTrie = sequences.reduce(
      (prev, curr) => populateSeqTrie(curr, false, prev, 4, true), null)

    expect(
      findOffTarget([{ seq: querySeq }], 4, [querySeq], false, seqTrie, true))
      .to.deep.equal([[{
        index: 1, targets: ['test1 (9, 13)']
      }, {
        index: 2, targets: ['querySeq (8, 12)']
      }, {
        index: 8, targets: ['querySeq (2, 6)']
      }]])
  })

  it('Find off-target, plus self, partial', () => {
    const sequences = [
      new Sequence('cgatggatggtagtcag', 'test1'),
      new Sequence('tgtcgatgcatg', 'test2'),
      new Sequence('acatcgatgttagtg', 'test3')
    ]
    const querySeq = new Sequence('tgtagccctagcgtcca', 'querySeq')
    const seqTrie = sequences.reduce(
      (prev, curr) => populateSeqTrie(curr, false, prev, 4, true), null)

    expect(
      findOffTarget([{ seq: querySeq, startIndex: 5, endIndex: 7 }],
        4, [querySeq], false, seqTrie, true))
      .to.deep.equal([[{
        index: 2, targets: ['querySeq (8, 12)']
      }]])
  })

  it('Find off-target (rev) from entire sequence (trivial case)', () => {
    const sequences = [
      new Sequence('aaaaa', 'test1'),
      new Sequence('ttttt', 'test2'),
      new Sequence('ccccc', 'test3')
    ]
    const querySeq = new Sequence('ggggg', 'querySeq')

    expect(findOffTarget([{ seq: querySeq }], 3, sequences, true, null))
      .to.deep.equal([[{
        index: 0, targets: ['test3 (0, 3)', 'test3 (1, 4)', 'test3 (2, 5)']
      }, {
        index: 1, targets: ['test3 (0, 3)', 'test3 (1, 4)', 'test3 (2, 5)']
      }, {
        index: 2, targets: ['test3 (0, 3)', 'test3 (1, 4)', 'test3 (2, 5)']
      }]])
  })

  it('Find off-target (rev) from entire sequence (not-so-trivial case)', () => {
    const sequences = [
      new Sequence('cgatggatggtagtcag', 'test1'),
      new Sequence('tgtcgatgcatg', 'test2'),
      new Sequence('acatcgatgttagtg', 'test3')
    ]
    const querySeq = new Sequence('tgtagctagtcca', 'querySeq')

    expect(findOffTarget([{ seq: querySeq }], 4, sequences, true, null))
      .to.deep.equal([[{
        index: 9,
        targets: ['test1 (3, 7)']
      }]])
    expect(findOffTarget([{ seq: querySeq }], 3, sequences, true, null))
      .to.deep.equal([[{
        index: 0, targets: ['test3 (0, 3)']
      }, {
        index: 5, targets: ['test1 (10, 13)', 'test3 (10, 13)']
      }, {
        index: 9, targets: ['test1 (4, 7)']
      }, {
        index: 10, targets: ['test1 (3, 6)', 'test1 (7, 10)']
      }]])
  })

  it('Find off-target (rev), plus self', () => {
    const sequences = [
      new Sequence('cgatggatggtagtcag', 'test1'),
      new Sequence('tgtcgatgcatg', 'test2'),
      new Sequence('acatcgatgttagtg', 'test3')
    ]
    const querySeq = new Sequence('tgtagctagtcca', 'querySeq')
    const seqTrie = sequences.reduce(
      (prev, curr) => populateSeqTrie(curr, true, prev, 4, true), null)

    expect(findOffTarget([{ seq: querySeq }], 4, [querySeq], true, seqTrie))
      .to.deep.equal([[{
        index: 2, targets: ['querySeq (4, 8)']
      }, {
        index: 3, targets: ['querySeq (3, 7)']
      }, {
        index: 4, targets: ['querySeq (2, 6)']
      }, {
        index: 5, targets: ['querySeq (5, 9)']
      }, {
        index: 9, targets: ['test1 (3, 7)']
      }]])
  })

  it('Find off-target (rev), plus self, partial', () => {
    const sequences = [
      new Sequence('cgatggatggtagtcag', 'test1'),
      new Sequence('tgtcgatgcatg', 'test2'),
      new Sequence('acatcgatgttagtg', 'test3')
    ]
    const querySeq = new Sequence('tgtagctagtcca', 'querySeq')
    const seqTrie = sequences.reduce(
      (prev, curr) => populateSeqTrie(curr, true, prev, 4, true), null)

    expect(findOffTarget([{ seq: querySeq, startIndex: 8, endIndex: 9 }],
      4, [querySeq], true, seqTrie, true))
      .to.deep.equal([[{
        index: 5, targets: ['querySeq (5, 9)']
      }]])
  })

  it('Generate sequence test, no attachments', () => {
    const sequences = [
      new Sequence('cgatggaatggtagtcagacgcgcccaggcccg', 'test1'),
      new Sequence('tgtccctccaatagggaaatttccc', 'test2'),
      new Sequence('acatcgatgtaagtgcttcta', 'test3')
    ]

    expect(findNovelSequence(
      10, '', '', 0, sequences, true, null, 3, null
    )).to.deep.equal([
      { offTargets: [], sequence: 'TGCTCAGTGC' },
      { offTargets: [], sequence: 'TGCTCAGTAA' },
      { offTargets: [], sequence: 'TCAGTGCTCA' },
      { offTargets: [], sequence: 'GTGCTCAGTT' },
      { offTargets: [], sequence: 'GTGCTCAGTG' },
      { offTargets: [], sequence: 'GTGCTCAGTA' },
      { offTargets: [], sequence: 'GTGCTCAACG' },
      { offTargets: [], sequence: 'GGTGCTCAGT' },
      { offTargets: [], sequence: 'GGTGCTCAAC' },
      { offTargets: [], sequence: 'GCTCAGTGCT' },
      { offTargets: [], sequence: 'GCTCAGTAAC' },
      { offTargets: [], sequence: 'CTCAGTGCTC' },
      { offTargets: [], sequence: 'CTCAGTAACG' },
      { offTargets: [], sequence: 'CAGTGCTCAG' },
      { offTargets: [], sequence: 'CAGTGCTCAA' },
      { offTargets: [], sequence: 'AGTGCTCAGT' },
      { offTargets: [], sequence: 'AGTGCTCAAC' }
    ])
  })

  it('Generate sequence test, with attachments', () => {
    const sequences = [
      new Sequence('cgatggaatggtagtcagacgcgcccaggcccg', 'test1'),
      new Sequence('tgtccctccaatagggaaatttccc', 'test2'),
      new Sequence('acatcgatgtaagtgcttcta', 'test3')
    ]

    expect(findNovelSequence(
      7, 'tgc', '', 0, sequences, true, null, 3, null
    )).to.deep.equal([
      { offTargets: [], sequence: 'TCAGTGC' },
      { offTargets: [], sequence: 'TCAGTAA' }
    ])
    expect(findNovelSequence(
      8, '', 'aa', 0, sequences, true, null, 3, null
    )).to.have.deep.members([
      { offTargets: [], sequence: 'TGCTCAGT' },
      { offTargets: [], sequence: 'CAGTGCTC' }
    ])
    expect(findNovelSequence(
      5, 'tgc', 'aa', 0, sequences, true, null, 3, null
    )).to.have.deep.members([
      { offTargets: [], sequence: 'TCAGT' }
    ])
  })

  it('Generate sequence test, with callback', () => {
    const sequences = [
      new Sequence('cgatggaatggtagtcagacgcgcccaggcccg', 'test1'),
      new Sequence('tgtccctccaatagggaaatttccc', 'test2'),
      new Sequence('acatcgatgtaagtgcttcta', 'test3')
    ]
    const result = []

    findNovelSequence(
      7, 'tgc', '', 0, sequences, true, null, 3, (seq) => result.push(seq)
    )
    findNovelSequence(
      8, '', 'aa', 0, sequences, true, null, 3, (seq) => result.push(seq)
    )
    findNovelSequence(
      5, 'tgc', 'aa', 0, sequences, true, null, 3, (seq) => result.push(seq)
    )

    expect(result).to.deep.equal([
      'TCAGTGC', 'TCAGTAA', 'TGCTCAGT', 'CAGTGCTC', 'TCAGT'])
  })

  it('Generate sequence test, with tolerance', () => {
    const sequences = [
      new Sequence('cgatggaatggtagtcagacgcgcccaggcccg', 'test1'),
      new Sequence('tgtccctccaatagggaaatttccc', 'test2'),
      new Sequence('acatcgatgtaagtgcttcta', 'test3'),
      new Sequence('agc', 'test4'),
      new Sequence('cgt', 'test5'),
      new Sequence('ttg', 'test6'),
      new Sequence('gaa', 'test7')
    ]

    expect(findNovelSequence(
      7, 'tgc', '', 1, sequences, true, null, 3
    )).to.deep.equal([
      {
        offTargets: [{
          index: 1, targets: ['test4 (0, 3)']
        }],
        sequence: 'TCAGTGC'
      }, {
        offTargets: [{
          index: 1, targets: ['test4 (0, 3)']
        }],
        sequence: 'TCAGTAA'
      }
    ])
    expect(findNovelSequence(
      8, '', 'aa', 1, sequences, true, null, 3
    )).to.have.deep.members([{
      sequence: 'TGCTCAGT',
      offTargets: [
        {
          index: 1,
          targets: [
            'test4 (0, 3)'
          ]
        }
      ]
    }, {
      sequence: 'TCAGTGGT',
      offTargets: [
        {
          index: 4,
          targets: [
            'test1 (24, 27)',
            'test2 (7, 10)'
          ]
        }
      ]
    }, {
      sequence: 'TCAGTAGT',
      offTargets: [
        {
          index: 4,
          targets: [
            'test3 (18, 21)'
          ]
        }
      ]
    }, {
      sequence: 'TCAGTAAT',
      offTargets: [
        {
          index: 5,
          targets: [
            'test2 (18, 21)'
          ]
        }
      ]
    }, {
      sequence: 'GTAACAGT',
      offTargets: [
        {
          index: 3,
          targets: [
            'test2 (0, 3)',
            'test3 (7, 10)'
          ]
        }
      ]
    }, {
      sequence: 'GGTTCAGT',
      offTargets: [
        {
          index: 2,
          targets: [
            'test1 (5, 8)',
            'test2 (15, 18)',
            'test7 (0, 3)'
          ]
        }
      ]
    }, {
      sequence: 'GGTGCAGT',
      offTargets: [
        {
          index: 3,
          targets: [
            'test3 (13, 16)',
            'Generated Sequence (2, 5)'
          ]
        }
      ]
    }, {
      sequence: 'CTCTCAGT',
      offTargets: [
        {
          index: 1,
          targets: [
            'test1 (16, 19)'
          ]
        }
      ]
    }, {
      sequence: 'CTCAGTGT',
      offTargets: [
        {
          index: 5,
          targets: [
            'test3 (0, 3)'
          ]
        }
      ]
    }, {
      sequence: 'CAGTCAGT',
      offTargets: [
        {
          index: 2,
          targets: [
            'test1 (17, 20)'
          ]
        }
      ]
    }, {
      sequence: 'CAGTAAGT',
      offTargets: [
        {
          index: 4,
          targets: [
            'test3 (15, 18)'
          ]
        }
      ]
    }, {
      sequence: 'ATAACAGT',
      offTargets: [
        {
          index: 3,
          targets: [
            'test2 (0, 3)',
            'test3 (7, 10)'
          ]
        }
      ]
    }, {
      sequence: 'AGTTCAGT',
      offTargets: [
        {
          index: 2,
          targets: [
            'test1 (5, 8)',
            'test2 (15, 18)',
            'test7 (0, 3)'
          ]
        }
      ]
    }, {
      sequence: 'AGTGCAGT',
      offTargets: [
        {
          index: 3,
          targets: [
            'test3 (13, 16)',
            'Generated Sequence (2, 5)'
          ]
        }
      ]
    }])
    expect(findNovelSequence(
      5, 'tgc', 'aa', 1, sequences, true, null, 3
    )).to.have.deep.members([
      {
        offTargets: [{
          index: 1, targets: ['test4 (0, 3)']
        }],
        sequence: 'TCAGT'
      }
    ])
  })
})
