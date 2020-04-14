<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <v-toolbar-title class="mx-3">Off-target Seeker</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn
        href="https://github.com/caoxiaoyi03/offtargetseeker"
        target="_blank"
        text
      >
        <span class="mr-2">Source code on Github</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-content>
      <MainComponent/>
    </v-content>
  </v-app>
</template>

<script>
import MainComponent from './components/MainComponent'

export default {
  name: 'App',

  components: {
    MainComponent
  },

  data: () => ({
    //
  })
}
</script>
