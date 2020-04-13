/* eslint-env mocha */
import chai, { expect } from 'chai'
import dirtyChai from 'dirty-chai'
import Sequence from '../../src/lib/sequence.js'
import SeqTrie from '../../src/lib/seqTrie.js'

chai.use(dirtyChai)

describe('SeqTrie tests', () => {
  it('SeqTrie create and search', () => {
    const seqTrie = new SeqTrie(Sequence.AVAILABLE_DEFINITIVE_STRING, 3, false)
    const sequences = [
      new Sequence('act', 'test1'),
      new Sequence('tag', 'test2'),
      new Sequence('gtc', 'test3'),
      new Sequence('atc', 'test4'),
      new Sequence('cct', 'test5'),
      new Sequence('taa', 'test6')
    ]
    sequences.forEach(seq => seqTrie.add(seq, seq.name))

    sequences.forEach(
      seq => expect(seqTrie.hasEntry(seq)).to.be.true())
    expect(seqTrie.hasEntry('aat')).to.be.false()
  })

  it('SeqTrie create, delete and search', () => {
    const seqTrie = new SeqTrie(Sequence.AVAILABLE_DEFINITIVE_STRING, 3, true)
    const sequences = [
      new Sequence('act', 'test1'),
      new Sequence('tag', 'test2'),
      new Sequence('gtc', 'test3'),
      new Sequence('atc', 'test4'),
      new Sequence('cct', 'test5'),
      new Sequence('taa', 'test6'),
      new Sequence('acc', 'test7')
    ]
    sequences.forEach(seq => seqTrie.add(seq, seq.name))
    seqTrie.deleteEntry(sequences[3], 'test4')
    seqTrie.deleteEntry(sequences[2], 'test3')
    sequences.splice(2, 2)

    sequences.forEach(
      seq => expect(seqTrie.hasEntry(seq)).to.deep.equal([seq.name]))
    expect(seqTrie.hasEntry('gtc')).to.be.empty()
    expect(seqTrie.hasEntry('atc')).to.be.empty()
  })

  it('SeqTrie saturation test', () => {
    const seqTrie = new SeqTrie(Sequence.AVAILABLE_DEFINITIVE_STRING, 2, true)
    const sequences = [
      'aa', 'at', 'ac', 'ag',
      'ta', 'tt', 'tc', 'tg',
      'ca', 'ct', 'cc', 'cg',
      'ga', 'gt', 'gc', 'gg'
    ]
    sequences.forEach(seq => seqTrie.add(seq, seq))
    expect(seqTrie.isSaturated()).to.be.true()

    seqTrie.deleteEntry('cg', 'cg')
    expect(seqTrie.isSaturated()).to.be.false()
  })

  it('SeqTrie immediateNext test', () => {
    const seqTrie = new SeqTrie(Sequence.AVAILABLE_DEFINITIVE_STRING, 2, true)
    const sequences = [
      'aa', 'at', 'ag',
      'ta', 'tt', 'tc', 'tg',
      'ca', 'ct', 'cc', 'cg'
    ]
    sequences.forEach(seq => seqTrie.add(seq, seq))

    expect(seqTrie.getImmediateNextSet('a')).to.have.keys(['A', 'T', 'G'])
    expect(seqTrie.getImmediateNextSet('g')).to.be.empty()
    expect(seqTrie.getImmediateNextSet('tc')).to.be.empty()

    expect(seqTrie.getAvailableImmediateNextSet('')).to.have.keys(['A', 'G'])
    expect(seqTrie.getAvailableImmediateNextSet('c')).to.be.empty()
    expect(seqTrie.getAvailableImmediateNextSet('g'))
      .to.have.keys(['A', 'T', 'C', 'G'])
    expect(seqTrie.getAvailableImmediateNextSet('a')).to.have.keys(['C'])
    expect(seqTrie.getAvailableImmediateNextSet('gc')).to.be.empty()
  })

  it('SeqTrie deepcopy test', () => {
    const seqTrie = new SeqTrie(Sequence.AVAILABLE_DEFINITIVE_STRING, 2, true)
    const sequences = [
      'aa', 'at', 'ac', 'ag',
      'ta', 'tt', 'tc',
      'ca', 'ct', 'cc', 'cg',
      'ga', 'gt'
    ]
    const sequencesNeg = [
      'tg',
      'gc', 'gg'
    ]
    const sequences2 = [
      'aa', 'at', 'ac', 'ag',
      'ta', 'tt', 'tc', 'tg',
      'ca', 'ct', 'cc', 'cg'
    ]
    const sequences2Neg = [
      'ga', 'gt', 'gc', 'gg'
    ]
    sequences.forEach(seq => seqTrie.add(seq, seq))
    const seqTrie2 = seqTrie.getDeepCopy()
    seqTrie2.deleteEntry('ga', 'ga')
    seqTrie2.deleteEntry('gt', 'gt')
    seqTrie2.add('tg', 'tg')

    sequences.forEach(
      seq => expect(seqTrie.hasEntry(seq)).to.deep.equal([seq]))
    sequencesNeg.forEach(seq => expect(seqTrie.hasEntry(seq)).to.be.empty())
    sequences2.forEach(
      seq => expect(seqTrie2.hasEntry(seq)).to.deep.equal([seq]))
    sequences2Neg.forEach(seq => expect(seqTrie2.hasEntry(seq)).to.be.empty())
  })
})
