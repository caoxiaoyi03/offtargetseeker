<template>
  <v-container>
    <v-col>
      <v-row>
        <v-card class="my-2 pa-3">
          <v-card-title>Input
            <v-spacer></v-spacer>
            <v-btn color="primary" :loading="calculating"
            :disabled="calculating" @click="calculateOffTargets">
              Find off-target hits
            </v-btn>
          </v-card-title>
          <v-row>
            <v-col>
              <v-card class="md3" max-height="500px">
                <v-card-subtitle class="pb-1">
                  <v-row class="px-3 align-content-center">
                    <div class="flex"><strong>Variable sequence candidates</strong></div>
                    <v-icon @click="clearCandidates">mdi-close</v-icon>
                  </v-row>
                </v-card-subtitle>
                <v-card-text>
                  <v-form v-model="candidateValid">
                    <v-textarea label="Add new candidate sequence, one line per sequence" append-outer-icon="mdi-plus"
                      v-model="newCandidate" @click:append-outer="addCandidate" :rules="[rules.validSequences]" :disabled="calculating" rows="3">
                    </v-textarea>
                    <v-subheader class="pa-1">Added candidates</v-subheader>
                    <div style="max-height: 250px;" class="overflow-y-auto">
                        <v-list dense>
                          <v-list-item v-if="!candidates.length">
                            <v-list-item-content>
                              <v-list-item-subtitle>
                                <em>(No candidates added.)</em>
                              </v-list-item-subtitle>
                            </v-list-item-content>
                          </v-list-item>
                          <v-list-item dense v-for="(seq, i) in candidates" :key="i">
                            <v-list-item-content v-if="!seq.isEditing">
                              <v-list-item-title v-text="seq.seq"></v-list-item-title>
                            </v-list-item-content>
                            <v-list-item-content v-if="seq.isEditing">
                              <v-text-field dense v-model="seq.seq" :rules="[rules.validSequences]" append-icon="mdi-check"
                                @click:append="submitEdit(i)" :disabled="calculating"></v-text-field>
                            </v-list-item-content>
                            <v-list-item-action>
                              <v-icon v-if="!seq.isEditing" :disabled="calculating" @click="editCandidate(i)">mdi-pencil</v-icon>
                            </v-list-item-action>
                            <v-list-item-action>
                              <v-icon v-if="!seq.isEditing" :disabled="calculating" @click="removeCandidate(i)">mdi-delete</v-icon>
                            </v-list-item-action>
                          </v-list-item>
                        </v-list>
                    </div>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col>
              <v-card class="md3" max-height="500px">
                <v-card-subtitle>
                  <strong>Environment</strong>
                </v-card-subtitle>
                <v-card-text>
                  <v-text-field v-model="windowLength" label="Off-target size"
                  hint="Number of base pairs for an off-target" type="number"
                  :disabled="calculating">
                  </v-text-field>
                  Please enter the surrounding sequences below,
                  <strong><em>
                    use "x" to indicate insertion locations (any consecutive
                    number of "x"s will be treated as one single insertion
                    point)
                  </em></strong>.
                  <v-form v-model="environmentValid">
                    <v-textarea v-model="lSequence" label="L sequence"
                      :rules="[rules.validSequenceWithAsterisk]" :disabled="calculating" rows="2">
                    </v-textarea>
                    <v-textarea v-model="rSequence" label="R sequence"
                      :rules="[rules.validSequenceWithAsterisk]" :disabled="calculating" rows="2">
                    </v-textarea>
                    <v-textarea v-model="cpSequence" label="CP sequence"
                      :rules="[rules.validSequenceWithAsterisk]" :disabled="calculating" rows="2">
                    </v-textarea>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-row>
      <v-row>
        <v-card max-height="800px" class="my-3 pa-3 flex">
          <v-card-title>Output</v-card-title>
          <v-card-text>
            <v-data-table show-expand multi-sort :headers="headers" :items="results" :search="search">
              <template v-slot:expanded-item="{ headers, item }">
                <td :colspan="headers.length">
                  <v-row class="px-3 pt-2 align-content-center">
                    <v-subheader class="md4">Candidate Sequence</v-subheader>
                    <div class="md4 pa-3 flex" style="word-break: break-word;">{{item.seq}}</div>
                    <v-subheader class="md4">Total number of off-target
                    hits</v-subheader>
                    <div class="md4 pa-3 flex">{{item.totalOffTargets}}</div>
                  </v-row>
                  <v-row class="px-3 pt-1 pb-4" v-if="item.totalOffTargets">
                    <v-card class="mx-3 flex" v-if="item.lOffTargets">
                      <v-subheader>L Sequence off-targets</v-subheader>
                      <div style="max-height: 200px;" class="overflow-y-auto mx-2 mt-1 mb-3">
                        <v-list dense>
                          <v-list-item v-for="(offTarget, index) in item.lOffTargets"
                          :key="'l' + index">
                            <v-list-item-content>
                              <v-row class="px-3">
                                <v-col cols="4" class="pa-1">
                                  <div class="mx-3 my-1">
                                    ({{offTarget.index}}, {{offTarget.index + windowLength}})
                                  </div>
                                </v-col>
                                <v-col cols="8" class="pa-1">
                                  <div class="mx-3 my-1">
                                    <div class="my-1" v-for="entry in
                                    offTarget.targets" :key="'l' + index + '-' + entry">
                                      {{entry}}
                                    </div>
                                  </div>
                                </v-col>
                              </v-row>
                            </v-list-item-content>
                          </v-list-item>
                        </v-list>
                      </div>
                    </v-card>
                    <v-card class="mx-3 flex" v-if="item.rOffTargets">
                      <v-subheader>R Sequence off-targets</v-subheader>
                      <div style="max-height: 200px;" class="overflow-y-auto mx-2 mt-1 mb-3">
                        <v-list dense>
                          <v-list-item v-for="(offTarget, index) in
                          item.rOffTargets" :key="'r' + index">
                            <v-list-item-content>
                              <v-row class="px-3">
                                <v-col cols="4" class="pa-1">
                                  <div class="mx-3 my-1">
                                    ({{offTarget.index}}, {{offTarget.index + windowLength}})
                                  </div>
                                </v-col>
                                <v-col cols="8" class="pa-1">
                                  <div class="mx-3 my-1">
                                    <div class="my-1" v-for="entry in
                                    offTarget.targets" :key="'l' + index + '-' + entry">
                                      {{entry}}
                                    </div>
                                  </div>
                                </v-col>
                              </v-row>
                            </v-list-item-content>
                          </v-list-item>
                        </v-list>
                      </div>
                    </v-card>
                    <v-card class="mx-3 flex" v-if="item.cpOffTargets">
                      <v-subheader>CP Sequence off-targets</v-subheader>
                      <div style="max-height: 200px;" class="overflow-y-auto mx-2 mt-1 mb-3">
                        <v-list dense>
                          <v-list-item v-for="(offTarget, index) in
                          item.cpOffTargets" :key="'cp' + index">
                            <v-list-item-content>
                              <v-row class="px-3">
                                <v-col cols="4" class="pa-1">
                                  <div class="mx-3 my-1">
                                    ({{offTarget.index}}, {{offTarget.index + windowLength}})
                                  </div>
                                </v-col>
                                <v-col cols="8" class="pa-1">
                                  <div class="mx-3 my-1">
                                    <div class="my-1" v-for="entry in
                                    offTarget.targets" :key="'l' + index + '-' + entry">
                                      {{entry}}
                                    </div>
                                  </div>
                                </v-col>
                              </v-row>
                            </v-list-item-content>
                          </v-list-item>
                        </v-list>
                      </div>
                    </v-card>
                  </v-row>
                </td>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-row>
   </v-col>
  </v-container>
</template>

<script>
import Sequence from '@/lib/sequence.js'
import { findOffTarget, populateSeqTrie } from '@/lib/seqUtil.js'

const DEFAULT_HEADERS = [{
  text: 'Candidate sequence',
  align: 'start',
  value: 'seq'
}, {
  text: 'Total # of off-targets',
  value: 'totalOffTargets'
}]

export default {
  name: 'MainComponent',

  data: () => ({
    candidates: [],
    candidateValid: true,
    calculating: false,
    environmentValid: true,
    lSequence: '',
    lHasInsert: false,
    rSequence: '',
    rHasInsert: false,
    cpSequence: '',
    cpHasInsert: false,
    newCandidate: '',
    windowLength: 4,
    headers: [{
      text: 'Candidate sequence',
      align: 'start',
      value: 'seq'
    }, {
      text: 'Total # of off-targets',
      value: 'totalOffTargets'
    }],
    results: [],
    search: '',
    rules: {
      validSequence: v => (!v || !v.match(/[^actg]/i) || 'Sequence invalid!'),
      validSequences: v => (!v || !v.match(/[^actg\n\s]/i) || 'Sequence invalid!'),
      validSequenceWithAsterisk: v =>
        (!v || !v.match(/[^actgxACTG]/) || 'Sequence invalid!')
    }
  }),

  methods: {
    addCandidate () {
      if (this.candidateValid) {
        const newCandidates =
          this.newCandidate.split(/[\s\n]+/).filter(seq => !!seq)
            .map(seq => ({ isEditing: false, seq }))
        this.candidates = this.candidates.concat(newCandidates)
        this.newCandidate = ''
      }
    },

    submitEdit (index) {
      if (this.candidateValid) {
        this.candidates[index].isEditing = false
      }
    },

    editCandidate (index) {
      this.candidates[index].isEditing = true
    },

    removeCandidate (index) {
      this.candidates.splice(index, 1)
    },

    clearCandidates () {
      this.candidates = []
    },

    buildQueryTargets (candidate, template, name, querySeqs, targetSeqs) {
      if (template.includes('x')) {
        const seqParts = template.split(/x+/)
        const newSequence = new Sequence(
          seqParts[0] + candidate + seqParts[1], name)
        querySeqs.push({
          seq: newSequence,
          startIndex: seqParts[0].length,
          endIndex: seqParts[0].length + candidate.length
        })
        targetSeqs.push(newSequence)
      }
    },

    calculateOffTargets () {
      if (this.newCandidate) {
        this.addCandidate()
      }
      if (
        this.candidateValid && this.environmentValid && this.candidates.length
      ) {
        // Some sequence need fill in parts
        if (
          !this.lSequence.includes('x') &&
          !this.rSequence.includes('x') &&
          !this.cpSequence.includes('x')
        ) {
          alert('No insertion field detected!')
          return
        }
        // first find sequences without any filling in parts
        let seqTrie = null
        this.headers = DEFAULT_HEADERS.slice()
        if (!this.lSequence.includes('x')) {
          seqTrie = populateSeqTrie(
            new Sequence(this.lSequence, 'L Sequence'), true, seqTrie,
            this.windowLength, true)
          this.lHasInsert = false
        } else {
          this.headers.push({
            text: '# of L-Sequence off-targets',
            value: 'lOffTargetCount'
          })
          this.lHasInsert = true
        }
        if (!this.rSequence.includes('x')) {
          seqTrie = populateSeqTrie(
            new Sequence(this.rSequence, 'R Sequence'), true, seqTrie,
            this.windowLength, true)
          this.rHasInsert = false
        } else {
          this.headers.push({
            text: '# of R-Sequence off-targets',
            value: 'rOffTargetCount'
          })
          this.rHasInsert = true
        }
        if (!this.cpSequence.includes('x')) {
          seqTrie = populateSeqTrie(
            new Sequence(this.cpSequence, 'CP Sequence'), true, seqTrie,
            this.windowLength, true)
          this.cpHasInsert = false
        } else {
          this.headers.push({
            text: '# of CP-Sequence off-targets',
            value: 'cpOffTargetCount'
          })
          this.cpHasInsert = true
        }
        this.results = []
        const rawResults = this.candidates.map(candidate => {
          // build query sequences (for query and also target)
          const querySequence = []
          const targetSequence = []
          this.buildQueryTargets(
            candidate.seq, this.lSequence, 'L Sequence',
            querySequence, targetSequence)
          this.buildQueryTargets(
            candidate.seq, this.rSequence, 'R Sequence',
            querySequence, targetSequence)
          this.buildQueryTargets(
            candidate.seq, this.cpSequence, 'CP Sequence',
            querySequence, targetSequence)
          return findOffTarget(
            querySequence, this.windowLength, targetSequence, true,
            seqTrie, true
          )
        })
        this.results = this.parseResults(rawResults)
      }
    },

    parseResults (rawResults) {
      return rawResults.map((resultEntry, index) => {
        const resultObj = {
          seq: this.candidates[index].seq,
          totalOffTargets: 0
        }
        if (this.lHasInsert) {
          resultObj.lOffTargets = resultEntry.shift()
          resultObj.lOffTargetCount = resultObj.lOffTargets.length
          resultObj.totalOffTargets += resultObj.lOffTargetCount
        }
        if (this.rHasInsert) {
          resultObj.rOffTargets = resultEntry.shift()
          resultObj.rOffTargetCount = resultObj.lOffTargets.length
          resultObj.totalOffTargets += resultObj.rOffTargetCount
        }
        if (this.cpHasInsert) {
          resultObj.cpOffTargets = resultEntry.shift()
          resultObj.cpOffTargetCount = resultObj.lOffTargets.length
          resultObj.totalOffTargets += resultObj.cpOffTargetCount
        }
        return resultObj
      })
    }
  }
}
</script>
