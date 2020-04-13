/* eslint-env mocha */
import chai, { expect } from 'chai'
import dirtyChai from 'dirty-chai'
import Sequence from '../../src/lib/sequence.js'

chai.use(dirtyChai)

describe('Sequence tests', () => {
  it('Sequence basic operation with name', () => {
    const sequence = new Sequence('aacctgangaa', 'test')
    expect(sequence.name).to.equal('test')
    expect(sequence.length).to.equal(11)
    expect(sequence.seq).to.equal('AACCTGANGAA')
    expect(sequence.fastaSeq).to.equal('>test\nAACCTGANGAA\n')
  })

  it('Sequence GC content', () => {
    expect(new Sequence('aacctgangaa').gcContent).to.equal(0.4)
    expect(new Sequence('nnnnnnn').gcContent).to.equal(0.0)
    expect(new Sequence('aaaatttt').gcContent).to.equal(0.0)
    expect(new Sequence('cgcgcgcgcgcg').gcContent).to.equal(1.0)
    expect(new Sequence('ccgatgtcga').gcContent).to.equal(0.6)
  })

  it('Reverse compliment with name', () => {
    const sequence = new Sequence('aacctganga', 'test rev')
    expect(sequence.revCompSeq).to.equal('TCNTCAGGTT')
    expect(sequence.revCompFastaSeq).to
      .equal('>Reverse compliment of test rev\nTCNTCAGGTT\n')
  })

  it('Sequence basic operation without name', () => {
    const sequence = new Sequence('aacctgaga')
    expect(sequence.name).to.be.empty()
    expect(sequence.length).to.equal(9)
    expect(sequence.seq).to.equal('AACCTGAGA')
    expect(sequence.fastaSeq).to.equal('>\nAACCTGAGA\n')
  })

  it('Reverse compliment with name', () => {
    const sequence = new Sequence('aacctgaga')
    expect(sequence.revCompSeq).to.equal('TCTCAGGTT')
    expect(sequence.revCompFastaSeq).to
      .equal('>\nTCTCAGGTT\n')
  })

  it('Slice seq with name', () => {
    const sequence = new Sequence('aacctgaga', 'test')
    let subSeq = sequence.slice(5)
    expect(subSeq.name).to.equal('test (5, 9)')
    expect(subSeq.length).to.equal(4)
    expect(subSeq.seq).to.equal('GAGA')
    expect(subSeq.fastaSeq).to.equal('>test (5, 9)\nGAGA\n')

    subSeq = sequence.slice(1, 7)
    expect(subSeq.fastaSeq).to.equal('>test (1, 7)\nACCTGA\n')

    subSeq = sequence.slice(-7, -2)
    expect(subSeq.fastaSeq).to.equal('>test (2, 7)\nCCTGA\n')

    subSeq = subSeq.slice(1, 3)
    expect(subSeq.fastaSeq).to.equal('>test (3, 5)\nCT\n')

    subSeq = sequence.slice(-7).slice(1, 3)
    expect(subSeq.fastaSeq).to.equal('>test (3, 5)\nCT\n')
  })
})
