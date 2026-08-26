/* Our World 5 — Unit 2: History's a Mystery
   Target grammar: passive voice, was/were + past participle + by; past continuous.

   Copy this file, rename it, change the content, and add a <script> tag for it
   in index.html and in each game page. The games themselves never change. */

OW5.registerPack({
  id: 'unit02-history',
  unit: 'Unit 2',
  title: "History's a Mystery",
  grammar: 'passive: was / were + past participle + by',

  theme: {
    corridor: 'The Tomb of the Nameless King',
    threat: 'THE KEEPER',
    flavour: 'Something has been walking these corridors for four thousand years. It has heard you.'
  },

  // 12 short clues, one-word answers, straight from the unit vocabulary.
  clues: [
    { q: 'A person who studies the past by digging.',            a: 'archaeologist' },
    { q: 'An object made by people long ago.',                   a: 'artefact' },
    { q: 'A room built to hold the body of a king.',             a: 'tomb' },
    { q: 'To dig something out of the ground carefully.',        a: 'excavate' },
    { q: 'To keep something safe so it does not decay.',         a: 'preserve' },
    { q: 'A body wrapped in cloth, found in Egypt.',             a: 'mummy' },
    { q: 'Broken pieces of very old cups and bowls.',            a: 'pottery' },
    { q: 'A huge stone building with four flat triangle sides.', a: 'pyramid' },
    { q: 'What is left standing of a very old building.',        a: 'ruins' },
    { q: 'Gold and jewels that were hidden long ago.',           a: 'treasure' },
    { q: 'Something that helps you prove what happened.',        a: 'evidence' },
    { q: 'Another word for very, very old.',                     a: 'ancient' }
  ],

  // Locked doors: a full written sentence using the unit's grammar.
  locked: [
    {
      prompt: 'The tomb / discover / a farmer / in 1922.  Write it in the passive.',
      model: 'The tomb was discovered by a farmer in 1922.'
    },
    {
      prompt: 'Write one sentence about the mummy using was + past participle + by.',
      model: 'The mummy was wrapped in cloth by the priests.'
    },
    {
      prompt: 'What were the workers doing when the door opened? Past continuous, full sentence.',
      model: 'The workers were clearing sand when the door opened.'
    }
  ],

  // Dark rooms: connected text, read ONCE, then one comprehension question.
  dark: [
    {
      text: 'In 1799, a soldier was digging near a river in Egypt. He found a heavy black stone ' +
            'covered in strange writing. The same message was carved on it in three different languages.',
      q: 'How many languages were on the stone?',
      a: 'three'
    },
    {
      text: 'The archaeologists worked for six years. They were clearing sand from the steps when they ' +
            'saw a sealed door. Behind it was a small room filled with gold. The king’s body was found ' +
            'in the next room, not this one.',
      q: "In which room was the king's body found?",
      a: 'the next room'
    }
  ]
});
