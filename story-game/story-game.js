(() => {
const genreStage = document.getElementById("story-genre-stage");
const selectStage = document.getElementById("story-select-stage");
const playStage = document.getElementById("story-play-stage");

const genreButtons = document.querySelectorAll("[data-genre-select]");
const storyOptionGrid = document.getElementById("story-option-grid");
const storySelectTitle = document.getElementById("story-select-title");
const storySelectCopy = document.getElementById("story-select-copy");
const backToGenresBtn = document.getElementById("story-back-to-genres");

const playTitle = document.getElementById("story-play-title");
const playCopy = document.getElementById("story-play-copy");
const storyImage = document.getElementById("story-image");
const storyBox = document.getElementById("story-box");
const choiceList = document.getElementById("choice-list");
const replayBtn = document.getElementById("story-replay");
const backToListBtn = document.getElementById("story-back-to-list");
const changeGenreBtn = document.getElementById("story-change-genre");
const backToTopButton = document.getElementById("story-back-to-top");

const stageMap = {
  genre: genreStage,
  select: selectStage,
  play: playStage,
};

const DEFAULT_PLAY_TITLE = "Story Play Area";
const DEFAULT_PLAY_COPY = "Make choices to continue the story.";
const DEFAULT_STORY_TEXT = "Choose a story to start playing.";

const recordGameHistory = (payload) => {
  if (window.FGHProfile && typeof window.FGHProfile.recordHistory === "function") {
    window.FGHProfile.recordHistory(payload);
  }
};

let storySessionActive = false;

const storyImageConfigs = {
  lostTempleSun: {
    basePath: "../The Lost Temple of the Sun",
    extension: "png",
    fitMode: "cover",
    nodes: {
      start: 1,
      temple_advice: 2,
      temple_left: 3,
      temple_key: 4,
      temple_mirror: 5,
      temple_flute: 6,
      temple_fight: 7,
      temple_reason: 8,
      temple_shadows_fight: 9,
      temple_shadows_embrace: 10,
      temple_flute_play: 11,
      temple_flute_sneak: 12,
      temple_guardian: {
        default: 13,
        temple_shadows_fight: 14,
        temple_shadows_embrace: 15,
      },
      temple_guardian_shared: 16,
      temple_right: 17,
      temple_guardian_right: 18,
      temple_flee_right: 19,
      temple_ending_good: {
        temple_flute_play: 20,
        temple_guardian: 21,
        temple_guardian_shared: 22,
        temple_guardian_right: 22,
        default: 21,
      },
      temple_ending_bad_elena: 23,
    },
  },
  pirateCurse: {
    basePath: "../assets/storyimg/pirate-curse",
    extension: "jpg",
    fitMode: "contain",
    nodes: {
      start: 1,
      pirate_cook_advice: 2,
      pirate_beach: {
        default: 3,
        pirate_cook_advice: 32,
      },
      pirate_follow_ghost: 4,
      pirate_curse_details: 5,
      pirate_help_ghost: {
        default: 6,
        pirate_curse_details: 33,
      },
      pirate_waterfall_cave: 7,
      pirate_take_one_bag: 8,
      pirate_take_all: {
        default: 9,
        pirate_examine_chest: 34,
      },
      pirate_examine_chest: 10,
      pirate_take_map: 11,
      pirate_take_map_and_coins: 12,
      pirate_curse_lifted: {
        default: 13,
        pirate_take_map_and_coins: 35,
      },
      pirate_sea_witch: 14,
      pirate_witch_charm: 15,
      pirate_witch_treasure: 16,
      pirate_betray: 17,
      pirate_curse_accepted: 18,
      pirate_return_to_blackbeard: 19,
      pirate_alone: 20,
      pirate_find_cook: 21,
      pirate_beach_help: 22,
      pirate_help_kai: 23,
      pirate_ask_cook: 24,
      pirate_mermaid_path: 25,
      pirate_ending_charm: 26,
      pirate_ending_free: 27,
      pirate_ending_free_but_poor: 28,
      pirate_ending_ghost: 29,
      pirate_ending_good_with_cook: 30,
      pirate_ending_leave: 31,
    },
  },
  abandonedAsylum: {
    basePath: "../The Abandoned Asylum",
    extension: "png",
    fitMode: "cover",
    nodes: {
      start: 1,
      asylum_courtyard: 2,
      asylum_hide_courtyard: 3,
      asylum_east: 4,
      asylum_ask_mary: 5,
      asylum_hide: 6,
      asylum_office_passage: 7,
      asylum_office_run: 22,
      asylum_child_help: 10,
      asylum_search_desk: 11,
      asylum_force_cabinet: 12,
      asylum_silver_key: 8,
      asylum_ready_to_ritual: 13,
      asylum_central: 15,
      asylum_ritual: 16,
      asylum_reason_graves: 17,
      asylum_fight_graves: 18,
      asylum_find_patients: 19,
      asylum_sneak_past: 20,
      asylum_confront_nurse: 21,
      asylum_fight_warden: 23,
      asylum_negotiate_warden: 24,
      asylum_help_warden: 25,
      asylum_journal_only: 14,
      asylum_escape_warden: 26,
      asylum_main: 27,
      asylum_office: 28,
      asylum_exorcism: 29,
      asylum_fight: 30,
      asylum_ward: 31,
      asylum_hall_search: 32,
      asylum_tunnel: 33,
      asylum_basement: 34,
      asylum_grab_key: 35,
      asylum_dagger_graves: 36,
      asylum_prayer_basement: 37,
      asylum_confront: 38,
      asylum_main_door: 39,
      asylum_hide_foyer: 39,
      asylum_floor2: 40,
      asylum_comfort: 9,
      asylum_ending_good: 41,
      asylum_ending_warden: 23,
      asylum_ending_haunted: 26,
      asylum_ending_alone: 38,
      asylum_ending_overwhelmed: 37,
      asylum_ending_escape_but_curse_remains: 26,
    },
  },
  whisperingWoods: {
    basePath: "../The Whispering Woods",
    extension: "png",
    fitMode: "cover",
    nodes: {
      start: 1,
      woods_carving: 2,
      woods_woodcutter_story: 3,
      woods_fireflies: 4,
      woods_ask_girl: 5,
      woods_help: 6,
      woods_run: 7,
      woods_fireflies_cottage: 8,
      woods_eat_stew: 9,
      woods_grab_jar: 9,
      woods_sacrifice: 10,
      woods_refuse: 10,
      woods_burn: 11,
      woods_trick: 11,
      woods_smash_jar: 12,
      woods_spirit_with_jar: 13,
      woods_hidden: 14,
      woods_spirit_ritual: 15,
      woods_return_to_hut: 16,
      woods_spirit_direct: 17,
      woods_dark: 18,
      woods_examine_cage: 19,
      woods_cage_fight: 20,
      woods_lockpick: 21,
      woods_call: 22,
      woods_escape_with_child: 23,
      woods_demand_help: 24,
      woods_ask_another: 25,
      woods_bargain: 26,
      woods_spirit_quest: 27,
      woods_hermit: 28,
      woods_burn_herbs: 29,
      woods_hermit_join: 30,
      woods_rescue: 31,
      woods_ending_jarred: 31,
      woods_lily_follow: 32,
      woods_find_silver: 33,
      woods_spirit: 34,
      woods_escape_with_lily: 35,
      woods_ending_guardian: 36,
      woods_ending_escape_without_child: 37,
      woods_ending_warned: 37,
      woods_ending_escape: 37,
      woods_ending_wander: 38,
      woods_ending_freedom: {
        woods_escape_with_lily: 35,
        default: 39,
      },
      woods_ending_trapped: 40,
      woods_ending_servant: 40,
      woods_ending_captured: 40,
    },
  },
};

const storyGenres = {
  adventure: {
    name: "Adventure",
    description: "Adventure selected. Choose one of these two stories to enter the play area.",
    stories: ["lostTempleSun", "pirateCurse"],
  },
  horror: {
    name: "Horror",
    description: "Horror selected. Choose one of these two stories to enter the play area.",
    stories: ["abandonedAsylum", "whisperingWoods"],
  },
};

const stories = {
  lostTempleSun: {
    name: "The Lost Temple of the Sun",
    genreKey: "adventure",
    genreName: "Adventure",
    cardTag: "Adventure 01",
    summary: "Explore a hidden temple with Elena, outwit Marcus, and prove yourself worthy of the legendary Sun Amulet.",
    preview: "White stone ruins, jungle riddles, ghostly priests, and a relic that punishes greed.",
    scene: "The jungle falls silent as the white-stone temple rises from the mountain ahead.",
    nodes: {
      start: {
        text: "The jungle falls silent as you push aside the final vines. Before you, carved into a mountain of white stone, looms the entrance to the Lost Temple of the Sun. Intricate reliefs of a blazing sun cover the archway, their edges worn by centuries of rain. Elena, her face streaked with sweat, points to two openings. \"The left path is wide but floods in the rainy season. My grandmother said it leads to the Hall of Trials. The right is narrow; the old priests guard it. They say only the worthy pass.\" She looks at you. \"Which way?\"",
        scene: "Mist coils around the temple entrance while Elena waits beside two ancient passages.",
        choices: [
          { text: "Take the left passage.", next: "temple_left" },
          { text: "Take the right passage.", next: "temple_right" },
          { text: "Ask Elena for her advice.", next: "temple_advice" },
        ],
      },
      temple_advice: {
        text: "Elena wipes her brow. \"My grandmother, Abuela, told me stories. The Hall of Trials will test your heart - your courage, your wisdom, your selflessness. If you pass, the amulet will recognize you. The right path is faster, but you must face the Guardian directly. It is said the Guardian can smell greed. If you have any darkness in you, it will destroy you.\" She smiles. \"I believe in you, explorer. Choose the path that feels right.\"",
        scene: "For a moment the jungle quiets, and Elena's voice is the only sound under the temple arch.",
        choices: [
          { text: "Take the left passage.", next: "temple_left" },
          { text: "Take the right passage.", next: "temple_right" },
        ],
      },
      temple_left: {
        text: "Water drips from the ceiling as you wade into the left passage. The air is cool and heavy with the scent of wet stone. After a hundred paces, the corridor opens into a vast hall lit by glowing crystals. In the centre, a stone table holds three objects: a golden key, a silver mirror, and a wooden flute. A disembodied voice echoes: \"Choose the tool that serves the people, not the self.\" Elena whispers, \"This is the Hall of Trials. Choose wisely.\"",
        scene: "Crystal light spills across the Hall of Trials where three mysterious objects wait on a stone table.",
        choices: [
          { text: "Take the golden key.", next: "temple_key" },
          { text: "Take the silver mirror.", next: "temple_mirror" },
          { text: "Take the wooden flute.", next: "temple_flute" },
        ],
      },
      temple_key: {
        text: "You grasp the golden key. Instantly the floor tilts and water rushes in from hidden channels. Elena cries out as she is swept away into darkness. You swim against the current, clutching the key, and reach a stone door that opens with a click. Beyond, Marcus stands, dagger drawn. \"You fool! The key only brings greed. Now hand it over.\" Behind him, you glimpse a chamber with the amulet on a pedestal.",
        scene: "Floodwater roars through the passage while Marcus blocks the doorway to the amulet chamber.",
        choices: [
          { text: "Fight Marcus.", next: "temple_fight" },
          { text: "Try to reason with him.", next: "temple_reason" },
        ],
      },
      temple_mirror: {
        text: "You lift the silver mirror. Instead of your reflection, you see the face of Elena's grandmother, Abuela. Her lips move: \"The mirror reflects truth. To enter the amulet chamber, you must face your own darkness.\" The mirror shatters, and the floor gives way. You fall into a pit of writhing shadows. They take the shapes of your fears: failure, betrayal, greed. They attack.",
        scene: "Shattered silver flashes as a pit of living shadows opens beneath your feet.",
        choices: [
          { text: "Fight the shadows.", next: "temple_shadows_fight" },
          { text: "Embrace the shadows.", next: "temple_shadows_embrace" },
        ],
      },
      temple_flute: {
        text: "You pick up the wooden flute. As you lift it, a melody fills the hall - soft, sweet, ancient. The water recedes, and a bridge of light appears, spanning the pit that had opened. Elena joins you, unharmed. \"The flute brings harmony,\" she says. You cross together into a peaceful chamber where a spectral jaguar lies curled around the amulet. It opens one eye. \"Play for me the song of the sun.\"",
        scene: "A bridge of light carries you into a quiet chamber guarded by a spectral jaguar.",
        choices: [
          { text: "Play the flute.", next: "temple_flute_play" },
          { text: "Try to sneak past the jaguar.", next: "temple_flute_sneak" },
        ],
      },
      temple_fight: {
        text: "Your blades clash in the narrow passage. Marcus is skilled, but you disarm him, sending his dagger clattering into the water. He snarls and flees into the shadows. As you catch your breath, a hidden door slides open, revealing the amulet chamber. But Elena is nowhere to be found. You search and find her bound in a side room - Marcus's men had captured her. You free her, and together you approach the pedestal.",
        scene: "Marcus retreats into darkness as the amulet chamber opens and Elena rejoins you.",
        choices: [
          { text: "Proceed to the amulet chamber.", next: "temple_guardian" },
        ],
      },
      temple_reason: {
        text: "You lower your weapon. \"Marcus, we don't have to fight. The key brought us here, but it's not about greed. Help me, and we share the amulet's glory.\" He hesitates, then sheathes his blade. \"Fine. But I get first look.\" Together you enter the chamber. The Guardian jaguar appears, its eyes like molten gold. \"You come with greed and with a truce. Prove your worth: sacrifice something of value.\" Marcus steps forward, offering his dagger. The Guardian accepts it, and the amulet floats toward you.",
        scene: "An uneasy truce settles over the chamber while the Guardian studies both of you.",
        choices: [
          { text: "Accept the Guardian's final test.", next: "temple_guardian_shared" },
        ],
      },
      temple_shadows_fight: {
        text: "You strike at the shadows, but each blow only makes them multiply. Elena's voice echoes from above: \"They are your doubts! You cannot kill them with force!\" You realize she is right. You drop your weapon, and the shadows dissolve. A ladder of light descends, and you climb out into the amulet chamber, where the Guardian awaits.",
        scene: "Your fears dissolve into light, and the Guardian watches from the chamber beyond.",
        choices: [
          { text: "Approach the Guardian.", next: "temple_guardian" },
        ],
      },
      temple_shadows_embrace: {
        text: "You open your arms and let the shadows merge with you. For a moment you feel your fears - failure, loss, greed - then they become part of your strength. The pit transforms into a staircase of light. Elena joins you, and you ascend to the amulet chamber, your spirit tempered.",
        scene: "A staircase of light rises from the darkness as you and Elena climb toward the amulet.",
        choices: [
          { text: "Approach the Guardian.", next: "temple_guardian" },
        ],
      },
      temple_flute_play: {
        text: "You raise the flute and play a simple tune - one you remember from your childhood. The melody fills the chamber, and the jaguar purrs, rising to its feet. \"The sun's song is in your heart. You are worthy.\" It steps aside, revealing the amulet. Elena claps her hands, and you lift the glowing relic. The chamber fills with warm light.",
        scene: "Warm sunlight pours through the chamber as the Guardian accepts your song.",
        choices: [
          { text: "Leave the temple.", next: "temple_ending_good" },
        ],
      },
      temple_flute_sneak: {
        text: "You try to tiptoe around the jaguar, but it senses you. It roars and pounces. Elena pushes you aside, taking the blow. The jaguar vanishes, but Elena is gravely injured. You carry her out of the temple, leaving the amulet behind. As you exit, the entrance collapses. Elena survives, but she will never walk again. You return to the village with nothing.",
        scene: "Dust and falling stone follow you out of the temple while Elena bleeds in your arms.",
        choices: [
          { text: "Return to the village.", next: "temple_ending_bad_elena" },
        ],
      },
      temple_guardian: {
        text: "The amulet floats above a pedestal, surrounded by a soft glow. The spectral jaguar circles it. \"Prove your worth. Answer me: What is the sun's true gift?\" You recall Abuela's words. Elena whispers the answer beside you. You speak aloud, \"The sun gives life.\" The jaguar nods. \"You understand. The amulet is yours to protect, not to hoard.\" It fades, and the relic settles into your hands.",
        scene: "The Guardian circles the glowing amulet as the whole chamber waits for your answer.",
        choices: [
          { text: "Take the amulet.", next: "temple_ending_good" },
        ],
      },
      temple_guardian_shared: {
        text: "The Guardian looks at you both. \"You came with greed and a truce. I have taken his dagger. Now you must prove your own worth: give up something you treasure.\" You hesitate, then offer a locket that belonged to your mother. The Guardian takes it, and the amulet descends. Marcus looks at you with respect. \"You are a true explorer.\"",
        scene: "The chamber glows brighter as your sacrifice changes Marcus's expression from greed to respect.",
        choices: [
          { text: "Take the amulet.", next: "temple_ending_good" },
        ],
      },
      temple_right: {
        text: "You choose the narrow, right passage. The walls close in, and you hear whispers - the old priests. Ahead, a shaft of sunlight pierces the darkness, illuminating a chamber. In its centre, the Guardian jaguar sits, waiting. \"You chose the direct path. Now face me. Answer my riddle or be consumed by shadow.\"",
        scene: "Sunlight cuts through the darkness while ghostly priests whisper behind the walls.",
        choices: [
          { text: "Answer the riddle: What is the sun's true gift?", next: "temple_guardian_right" },
          { text: "Try to flee back the way you came.", next: "temple_flee_right" },
        ],
      },
      temple_guardian_right: {
        text: "You think of Abuela's lessons. \"The sun gives life,\" you say. The jaguar's eyes soften. \"You are worthy. Take the amulet.\" It steps aside, revealing the amulet on a pedestal. Elena rushes to your side, and you lift it together. The chamber glows, and the way out opens.",
        scene: "A shaft of sunlight widens as the Guardian steps aside and Elena joins you at the pedestal.",
        choices: [
          { text: "Exit the temple.", next: "temple_ending_good" },
        ],
      },
      temple_flee_right: {
        text: "You turn and run, but the passage twists, and you find yourself lost. Shadows close in, and you hear the priests laughing. You wander for hours until you collapse. When you wake, you are outside the temple, but your memory is clouded. You return to the village, unable to recall the path. The amulet remains lost.",
        scene: "The jungle sunlight feels distant as the temple spits you back out without its treasure.",
        end: true,
      },
      temple_ending_good: {
        text: "You emerge from the temple into the sunlight. Elena's village celebrates. The amulet brings rain to their fields and heals the sick. Marcus, now an ally, helps guard the treasure. Abuela smiles, saying, \"You have brought the sun back to us.\" Your name becomes legend, and the temple's guardians rest in peace.",
        scene: "Golden light washes over the village as the Sun Amulet returns life to the land.",
        end: true,
      },
      temple_ending_bad_elena: {
        text: "You sit by Elena's bedside in the village. Her leg will never heal, but she smiles. \"We tried. The temple keeps its secrets.\" You return to the jungle, vowing to find another way, but the entrance is sealed. The amulet remains hidden, and you carry the guilt of your greed. You become a storyteller, warning others of the temple's trials.",
        scene: "The village is quiet at dusk as you sit with Elena and remember what greed cost.",
        end: true,
      },
    },
  },
  pirateCurse: {
    name: "The Pirate's Curse",
    genreKey: "adventure",
    genreName: "Adventure",
    cardTag: "Adventure 02",
    summary: "Sail to Morgan's Isle, choose whether to trust a ghost, and decide if greed or sacrifice will rule the fate of the Sea Serpent.",
    preview: "Storm seas, cursed treasure, sea witches, and a ghost captain waiting beyond the waterfall cave.",
    scene: "Lightning reveals Morgan's Isle as the Sea Serpent drives toward the cursed shore.",
    nodes: {
      start: {
        text: "The Sea Serpent cuts through stormy seas. Lightning illuminates a jagged island on the horizon. Captain Blackbeard points a cutlass at the shore. \"That's Morgan's Isle! His treasure is there - enough gold to buy a kingdom. But a curse protects it.\" He looks at you. \"You're coming ashore. Bring the longboat.\" The crew mutters. The old Cook pulls you aside. \"Beware, lad. Morgan's ghost walks that island. He was betrayed by Blackbeard. If you meet him, listen - don't fight.\"",
        scene: "Lightning flashes over Morgan's Isle while Blackbeard orders you toward the cursed shore.",
        choices: [
          { text: "Land on the beach.", next: "pirate_beach" },
          { text: "Ask the Cook for more advice.", next: "pirate_cook_advice" },
        ],
      },
      pirate_cook_advice: {
        text: "The Cook hands you a small wooden charm carved like a turtle. \"This belonged to Captain Morgan. It may help you see the truth.\" He leans closer. \"The ghost won't harm you if you come in peace. But Blackbeard will stop at nothing. Find the treasure cave behind the waterfall. And remember: greed binds, generosity frees.\"",
        scene: "The Cook presses Morgan's old turtle charm into your palm as thunder rolls over the deck.",
        choices: [
          { text: "Land on the beach.", next: "pirate_beach" },
        ],
      },
      pirate_beach: {
        text: "The longboat scrapes onto white sand. Blackbeard, the First Mate, and you step ashore. Blackbeard snarls, \"You two go inland. I'll search the cove.\" He points to a path into the jungle. You and the Cook head into the thick foliage. After a few minutes, a shimmering figure appears ahead - a ghost in a tattered captain's coat.",
        scene: "White sand gives way to thick jungle as a ghostly captain appears between the trees.",
        choices: [
          { text: "Follow the ghost.", next: "pirate_follow_ghost" },
          { text: "Return to Blackbeard.", next: "pirate_return_to_blackbeard" },
          { text: "Ask the Cook what to do.", next: "pirate_ask_cook" },
        ],
      },
      pirate_follow_ghost: {
        text: "The ghost glides through the trees, leading you to a hidden grotto with a small waterfall. It solidifies into the spectral form of Captain Morgan. \"You carry my charm. Good. Blackbeard stole my treasure and left me to die. Now I am bound to this island until the gold is returned to the sea. Will you help me?\"",
        scene: "Captain Morgan's ghost waits beside the waterfall grotto where the treasure cave is hidden.",
        choices: [
          { text: "Yes, I'll help you break the curse.", next: "pirate_help_ghost" },
          { text: "I'll take the key to Blackbeard.", next: "pirate_betray" },
          { text: "Can you tell me more about the curse?", next: "pirate_curse_details" },
        ],
      },
      pirate_curse_details: {
        text: "Morgan's ghost sighs. \"When Blackbeard took my ship, he forced me to lead him here. I hid the treasure in a cave behind the waterfall. He killed me and left. Now every soul who takes from the chest without returning a portion to the sea is bound to the island. The only way to break it is to willingly cast the gold back into the waves.\" He holds out a rusted key. \"This opens the chest. Choose wisely.\"",
        scene: "The ghost captain's voice echoes against the grotto walls while the rusted key glints in his hand.",
        choices: [
          { text: "I'll help you.", next: "pirate_help_ghost" },
          { text: "I'll take the key to Blackbeard.", next: "pirate_betray" },
        ],
      },
      pirate_help_ghost: {
        text: "You take the key. Morgan's ghost points toward the waterfall. \"The cave is behind it. Take only what you need to break the curse - a single bag of coins will do. Return it to the sea at dawn, and I shall be free.\" He fades, leaving you with the Cook. You approach the waterfall.",
        scene: "Spray from the waterfall fills the air while the rusted key grows cold in your hand.",
        choices: [
          { text: "Go behind the waterfall.", next: "pirate_waterfall_cave" },
          { text: "Return to the beach to get more help.", next: "pirate_beach_help" },
        ],
      },
      pirate_waterfall_cave: {
        text: "You swim behind the waterfall into a cavern lit by glowing algae. Piles of gold coins, jewels, and ancient artifacts glitter. In the centre, a massive iron chest stands open, overflowing with treasure. The Cook whispers, \"Remember Morgan's words - take only a little.\"",
        scene: "Glowing algae light the treasure cave where the iron chest waits beneath the falling water.",
        choices: [
          { text: "Take a single bag of coins.", next: "pirate_take_one_bag" },
          { text: "Take as much as you can carry.", next: "pirate_take_all" },
          { text: "Examine the chest more closely.", next: "pirate_examine_chest" },
        ],
      },
      pirate_take_one_bag: {
        text: "You fill a small leather pouch with coins and a few jewels. The moment you close it, the cave rumbles, but nothing else happens. The Cook nods. \"Now, to the sea.\" You hurry back through the jungle and reach the beach just as dawn breaks. The surf foams around your boots as the island waits for your choice.",
        scene: "Dawn breaks over the beach while the bag of treasure feels heavier than it should.",
        choices: [
          { text: "Throw the coins into the sea.", next: "pirate_curse_lifted" },
        ],
      },
      pirate_take_all: {
        text: "You stuff your pockets, your bag, and even your shirt with gold. The Cook pleads, \"Stop! You'll doom us!\" But you ignore him. As you lift a handful of jewels, the cave shakes violently. Chains rattle, and Morgan's ghost reappears, now twisted into a monstrous serpent. \"Greed binds!\" it hisses. The serpent wraps around you, dragging you into the earth. You become another warning whispered to future treasure hunters.",
        scene: "The treasure cave tears open as the ghost captain twists into a serpent of chains and shadow.",
        end: true,
      },
      pirate_examine_chest: {
        text: "You peer inside the chest and notice a small scroll wedged beneath the coins. You pull it out - it's a map showing another island, marked with a star. The Cook gasps. \"That's the Island of the Tides - where the Sea Witch lives. She might know how to break the curse without losing the treasure.\"",
        scene: "A salt-stained map lies hidden under the treasure, pointing toward the Island of the Tides.",
        choices: [
          { text: "Take the map and leave the treasure.", next: "pirate_take_map" },
          { text: "Take a bag of coins as well.", next: "pirate_take_map_and_coins" },
          { text: "Ignore the map and take the gold.", next: "pirate_take_all" },
        ],
      },
      pirate_take_map: {
        text: "You take the scroll and leave the chest untouched. The cave is still. Outside, Morgan's ghost appears, surprised. \"You chose wisdom over wealth. Perhaps there is another way.\" He tells you the Sea Witch lives on a reef nearby. \"She may help you, but she will demand a price.\"",
        scene: "Morgan's ghost watches you step from the cave with the map but no gold.",
        choices: [
          { text: "Seek the Sea Witch.", next: "pirate_sea_witch" },
          { text: "Return to the ship and forget this.", next: "pirate_ending_leave" },
        ],
      },
      pirate_take_map_and_coins: {
        text: "You take the map and a small bag of coins. The cave trembles slightly, but Morgan's ghost does not appear. You hurry back to the beach. The Cook says, \"Now we must choose - cast the coins into the sea or find the witch.\"",
        scene: "You stand at the shoreline with a secret map in one hand and a cursed bag of coins in the other.",
        choices: [
          { text: "Cast the coins into the sea.", next: "pirate_curse_lifted" },
          { text: "Seek the Sea Witch with the map.", next: "pirate_sea_witch" },
        ],
      },
      pirate_curse_lifted: {
        text: "As the coins sink into the waves, the fog lifts. Morgan's ghost appears, smiling. \"Thank you. I am free.\" He fades, and a gentle breeze blows. The Cook shouts, \"The curse is broken!\" You return to the Sea Serpent and tell the crew. Blackbeard is nowhere to be found - his greed consumed him. You are hailed as the new captain, and your fairness turns the ghost story of Morgan's Isle into a legend of mercy instead of greed.",
        scene: "The cursed fog clears from the sea as Morgan's spirit vanishes with the dawn tide.",
        end: true,
      },
      pirate_sea_witch: {
        text: "You and the Cook sail a small dinghy to a reef where a hut sits on stilts above the water. A woman with seaweed hair and eyes like pearls greets you. \"I know why you've come. Morgan's curse can be lifted without losing the gold, but you must give me something precious.\"",
        scene: "The Witch of the Tides waits above the reef in a hut swaying over glowing water.",
        choices: [
          { text: "Give her the Cook's charm.", next: "pirate_witch_charm" },
          { text: "Give her your share of the treasure.", next: "pirate_witch_treasure" },
          { text: "Refuse and leave.", next: "pirate_ending_leave" },
        ],
      },
      pirate_witch_charm: {
        text: "You hand over the wooden turtle charm. The Witch nods and whispers a spell. The ocean glows, and you feel a weight lift from the island. \"The curse is broken. Go now.\" When you return, the chest is still there, but Morgan's ghost is gone. The gold is yours, but the charm is not.",
        scene: "Moonlit water shines around the reef as the witch's bargain tears the curse apart.",
        choices: [
          { text: "Sail away with the treasure.", next: "pirate_ending_charm" },
        ],
      },
      pirate_witch_treasure: {
        text: "You offer your bag of coins. The Witch laughs. \"A fair trade.\" She chants, and the curse shatters. The island's mist clears. You have no gold, but you have earned something rarer than plunder.",
        scene: "The reef glows green as your treasure dissolves into the witch's spell.",
        choices: [
          { text: "Return to the Sea Serpent.", next: "pirate_ending_free" },
        ],
      },
      pirate_betray: {
        text: "You take the key and rush back to Blackbeard. He grins and orders the First Mate to tie up the Cook. \"Show me the cave.\" You lead him behind the waterfall. Blackbeard opens the chest, laughing, but the moment he touches the gold, chains spring from the chest, wrapping around him. \"No! The curse!\" he screams. The First Mate flees. You try to save Blackbeard, but the chains drag him into the chest, which slams shut. Morgan's ghost appears. \"You chose greed. Now you are bound. You have one year to return the treasure to the sea, or you will share his fate.\"",
        scene: "Blackbeard's laughter dies inside the cave as cursed chains drag him into the chest.",
        choices: [
          { text: "Accept the curse and promise to return the gold.", next: "pirate_curse_accepted" },
          { text: "Try to escape and ignore the curse.", next: "pirate_ending_ghost" },
        ],
      },
      pirate_curse_accepted: {
        text: "You spend the next year sailing, but the weight of the curse follows you. At last you return, cast the treasure into the sea, and Morgan's ghost vanishes. You are free, but you have nothing left. The waves carry off the last of the cursed gold as a new life waits beyond the island.",
        scene: "A year later, the surf closes over the treasure and the curse finally releases you.",
        choices: [
          { text: "Start over in peace.", next: "pirate_ending_free_but_poor" },
        ],
      },
      pirate_return_to_blackbeard: {
        text: "You turn back and find Blackbeard on the beach, furious. \"You let the ghost escape! I saw it!\" He draws his cutlass. \"You're coming with me.\" He forces you to lead him into the jungle. You try to mislead him, but he finds the grotto. He grabs the key, but the ghost appears and pulls him into the water. You are left alone on the island while the First Mate vanishes into the trees.",
        scene: "Blackbeard is dragged beneath the grotto water, leaving you stranded with the curse still unresolved.",
        choices: [
          { text: "Search for the treasure yourself.", next: "pirate_alone" },
          { text: "Try to find the Cook.", next: "pirate_find_cook" },
        ],
      },
      pirate_alone: {
        text: "You wander the island and eventually find the waterfall cave. Inside, the chest is open. You take a handful of gold, but the ghost appears. \"You took without offering. Now you are mine.\" The cave collapses around you, and your bones join the treasure-seekers who came before.",
        scene: "Rock and seawater close over the cave as the island claims another greedy soul.",
        end: true,
      },
      pirate_find_cook: {
        text: "You find the Cook tied up near the beach. He frees himself with your help. \"We must find the key before Blackbeard does.\" You search and find the key near the grotto. The Cook leads you to the waterfall cave. Inside, you both take a small bag of coins and throw them into the sea. The curse lifts, and the island finally exhales.",
        scene: "With the Cook beside you, the island's curse loosens as the first coins touch the surf.",
        choices: [
          { text: "Sail back to port.", next: "pirate_ending_good_with_cook" },
        ],
      },
      pirate_beach_help: {
        text: "You decide to return to the beach to get more help. There you find Kai, a native islander, who paddles up in a canoe. \"I saw your ship. The curse is strong. I know a way to break it without losing the gold. But you must help my people first - the witch has taken our fishing grounds.\"",
        scene: "Kai waits in a narrow canoe at the edge of the beach, offering help in exchange for aid.",
        choices: [
          { text: "Help Kai defeat the witch.", next: "pirate_help_kai" },
          { text: "Return to the cave alone.", next: "pirate_waterfall_cave" },
        ],
      },
      pirate_help_kai: {
        text: "Kai leads you to the witch's hut on the far side of the island. Together you trick her into drinking a sleeping potion, then free the fish she had trapped. In gratitude, Kai gives you a pearl that can break any curse. You return to the treasure cave, place the pearl in the chest, and the curse vanishes. You take the gold and share it with Kai's village, turning Morgan's treasure into a blessing instead of a burden.",
        scene: "The pearl glows inside the chest as the curse breaks and the island's waters turn calm.",
        end: true,
      },
      pirate_ask_cook: {
        text: "The Cook says, \"We should not rush. There may be other paths.\" He leads you to a hidden cove where a mermaid sits on a rock. She offers to guide you to the treasure cave safely, in exchange for a promise: that you will not take more than you need.",
        scene: "A mermaid waits in a moonlit cove, offering a safer path beneath the water.",
        choices: [
          { text: "Accept the mermaid's help.", next: "pirate_mermaid_path" },
          { text: "Refuse and follow the ghost.", next: "pirate_follow_ghost" },
        ],
      },
      pirate_mermaid_path: {
        text: "The mermaid leads you through an underwater tunnel that opens directly into the treasure cave. She points to the chest. \"Remember your promise.\" You take one bag of coins and cast it into the sea through a natural pool. The curse lifts. The mermaid smiles and disappears. By the time you sail away, the Sea Serpent has a new captain - one known for fairness, not fear.",
        scene: "Moonlit water pours through the hidden pool as the mermaid's promise breaks Morgan's curse.",
        end: true,
      },
      pirate_ending_charm: {
        text: "You sail away rich, but the loss of Morgan's turtle charm stays with you. In time, you use your wealth to help desperate ports and hungry crews. The treasure bought comfort, but the sacrifice taught you purpose, and the story of Morgan's Isle follows you wherever the sea is rough.",
        scene: "Gold fills your hold, but the missing charm leaves an ache no coin can replace.",
        end: true,
      },
      pirate_ending_free: {
        text: "You leave the island with no gold, but the curse is gone and the crew respects the choice you made. Blackbeard falls, the Sea Serpent becomes a free ship, and you take command with nothing but open water ahead of you.",
        scene: "The Sea Serpent sails from Morgan's Isle lighter in treasure and richer in freedom.",
        end: true,
      },
      pirate_ending_free_but_poor: {
        text: "You start over as a humble fisherman, owning little but fearing nothing. The sea no longer whispers Morgan's curse in your sleep, and that freedom is worth more than any chest of gold.",
        scene: "A quiet sunrise over simple fishing waters marks the end of the curse and the start of a smaller life.",
        end: true,
      },
      pirate_ending_ghost: {
        text: "You try to forget the island, but Morgan's ghost haunts your dreams. One night, during a storm, the Sea Serpent is wrecked on a reef. You wash ashore on Morgan's Isle, now a ghost yourself, doomed to guard the treasure and repeat Blackbeard's mistake forever.",
        scene: "Storm waves throw you back onto Morgan's Isle where the curse claims you as its newest ghost.",
        end: true,
      },
      pirate_ending_good_with_cook: {
        text: "You and the Cook sail back to port. He becomes your first mate, and you buy a small ship. Together you trade fairly, and you never return to Morgan's Isle. The ghost's story becomes a legend you tell to sailors whenever greed starts to sound like destiny.",
        scene: "You leave the island beside the Cook, bound by trust instead of treasure.",
        end: true,
      },
      pirate_ending_leave: {
        text: "You choose freedom over treasure and sail away from Morgan's Isle before the curse can claim another soul. You never see the gold, but you keep your life, your crew, and the knowledge that not every treasure should be taken.",
        scene: "Morgan's Isle fades into the storm behind you as you choose the open sea over cursed gold.",
        end: true,
      },
    },
  },
  abandonedAsylum: {
    name: "The Abandoned Asylum",
    genreKey: "horror",
    genreName: "Horror",
    cardTag: "Horror 01",
    summary: "Investigate the disappearances at Blackwood Asylum, help Mary and the trapped ghosts, and uncover how to stop Dr. Graves.",
    preview: "Ghost nurses, cursed journals, hidden passages, and a final ritual that could free the asylum forever.",
    scene: "Blackwood Asylum looms against a bruised sky while the iron gates groan open.",
    nodes: {
      start: {
        text: "The iron gates of Blackwood Asylum groan as you push them open. The building looms against a bruised sky. Your flashlight cuts through the darkness, revealing a courtyard choked with weeds. A whisper drifts from the east wing: \"Help me...\" Another sound - heavy footsteps - echoes from the main building. You clutch your notebook, determined to uncover the truth behind the disappearances.",
        scene: "Your flashlight cuts across the courtyard while the east wing whispers and the main hall answers with heavy footsteps.",
        choices: [
          { text: "Go to the east wing.", next: "asylum_east" },
          { text: "Enter the main building.", next: "asylum_main" },
          { text: "Investigate the courtyard.", next: "asylum_courtyard" },
        ],
      },
      asylum_courtyard: {
        text: "Weeds and dead leaves crunch underfoot. In the centre stands a statue of a doctor, now headless. At its base, you find a rusted key with an engraving: \"Warden's Office.\" As you pick it up, the statue's eyes glow red. The ground trembles, and a whisper hisses, \"Thief.\" You run back toward the building.",
        scene: "The headless statue seems to watch you while the rusted key trembles in your hand.",
        choices: [
          { text: "Try the key on the main door.", next: "asylum_main_door" },
          { text: "Return to the entrance and go to the east wing.", next: "asylum_east" },
          { text: "Hide behind a broken fountain.", next: "asylum_hide_courtyard" },
        ],
      },
      asylum_hide_courtyard: {
        text: "You crouch behind a crumbling fountain as a ghostly nurse floats past, scanning the courtyard. She passes without seeing you. You wait until the coast is clear, then creep toward the east wing.",
        scene: "The broken fountain shields you while the ghost nurse patrols the courtyard.",
        choices: [
          { text: "Proceed to the east wing.", next: "asylum_east" },
        ],
      },
      asylum_east: {
        text: "The east wing is a maze of padded cells. The walls are covered with scratch marks. The whispering grows louder. In the last cell, you see a young woman in a tattered gown - Mary. \"Please, don't let him find me again,\" she pleads. \"Dr. Graves punishes those who try to leave. But Orderly Thomas hid his journal in the warden's office. It has prayers that can banish him.\" Suddenly, heavy footsteps echo.",
        scene: "Mary huddles in the last padded cell while heavy footsteps stalk the corridor outside.",
        choices: [
          { text: "Hide with Mary.", next: "asylum_hide" },
          { text: "Confront the footsteps.", next: "asylum_confront" },
          { text: "Run to the warden's office.", next: "asylum_office_run" },
          { text: "Ask Mary about Orderly Thomas.", next: "asylum_ask_mary" },
        ],
      },
      asylum_ask_mary: {
        text: "Mary shivers. \"Thomas was the only kind orderly. He tried to help us escape, but Dr. Graves caught him. Before he died, he wrote everything in a red journal. It's in the warden's office, behind a false wall.\" She points to a corridor. \"Go quickly. I'll distract the footsteps.\"",
        scene: "Mary points down the corridor while the footsteps close in.",
        choices: [
          { text: "Run to the warden's office.", next: "asylum_office_run" },
          { text: "Stay and hide with Mary.", next: "asylum_hide" },
        ],
      },
      asylum_hide: {
        text: "You squeeze into a dark corner with Mary. The footsteps stop at the door, then move away. \"He's gone for now,\" Mary whispers. \"But you must find the journal. There's also a silver dagger in the warden's cabinet - it can cut the chains binding us.\" She leads you through a hidden passage.",
        scene: "Mary leads you into a hidden passage once the footsteps move on.",
        choices: [
          { text: "Follow Mary through the passage.", next: "asylum_office_passage" },
        ],
      },
      asylum_office_passage: {
        text: "Mary guides you through dusty corridors to a locked door. \"The warden's office,\" she says. You use the key from the courtyard to open it. Inside, a desk holds a red journal - Orderly Thomas's. On the wall hangs a cabinet. You try to open it, but it's locked. A ghost child appears - Patient 13.",
        scene: "The warden's office opens at last, revealing Thomas's journal and the locked cabinet.",
        choices: [
          { text: "Ask the child for help.", next: "asylum_child_help" },
          { text: "Search the desk for another key.", next: "asylum_search_desk" },
        ],
      },
      asylum_child_help: {
        text: "The boy whispers, \"I know where the key is. Dr. Graves keeps it around his neck. But he's in the basement.\" He points to a trapdoor. \"If you go down, he'll sense you.\"",
        scene: "Patient 13 points toward the basement trapdoor as the office grows colder.",
        choices: [
          { text: "Go to the basement.", next: "asylum_basement" },
          { text: "Try to open the cabinet without the key.", next: "asylum_force_cabinet" },
        ],
      },
      asylum_search_desk: {
        text: "You rummage through the desk and find a small key hidden under a loose board. It opens the cabinet. Inside are the silver dagger and a note: \"To break the curse, recite the prayer of release while cutting the chains.\"",
        scene: "The cabinet clicks open, revealing the silver dagger beside Thomas's ritual note.",
        choices: [
          { text: "Take the dagger and journal.", next: "asylum_ready_to_ritual" },
          { text: "Leave the dagger and just take the journal.", next: "asylum_journal_only" },
        ],
      },
      asylum_force_cabinet: {
        text: "You try to pry the cabinet open with a letter opener. It snaps. The noise alerts Dr. Graves. He appears, laughing, and you are trapped in the office. Mary screams, but you cannot escape.",
        scene: "Dr. Graves appears in the office doorway while the broken letter opener drops to the floor.",
        choices: [
          { text: "You cannot escape.", next: "asylum_ending_trapped" },
        ],
      },
      asylum_ready_to_ritual: {
        text: "You take the dagger and the journal. Mary says, \"Now we need to cut the chains in the central chamber. That's where Graves keeps the souls he's captured.\"",
        scene: "The silver dagger and red journal are finally in your hands.",
        choices: [
          { text: "Go to the central chamber.", next: "asylum_central" },
          { text: "Look for other patients first.", next: "asylum_find_patients" },
        ],
      },
      asylum_journal_only: {
        text: "You take only the journal. Mary urges you to leave. You recite the prayer, but without the dagger, the chains are not broken. Graves attacks, and you barely escape the asylum. The disappearances continue.",
        scene: "You flee clutching the journal while the unbroken curse continues beneath the asylum.",
        choices: [
          { text: "Escape into the night.", next: "asylum_ending_escape_but_curse_remains" },
        ],
      },
      asylum_central: {
        text: "You reach the central chamber - a vast room with a towering iron cage. Inside, spectral chains bind dozens of ghosts. Dr. Graves stands before it, his form flickering. \"You dare free them?\" He raises his hand, and shadows surge toward you.",
        scene: "The towering iron cage rattles while Dr. Graves commands the shadows in the central chamber.",
        choices: [
          { text: "Recite the prayer while cutting the chains.", next: "asylum_ritual" },
          { text: "Try to reason with Dr. Graves.", next: "asylum_reason_graves" },
          { text: "Fight him with the dagger.", next: "asylum_fight_graves" },
        ],
      },
      asylum_ritual: {
        text: "You open the journal and read the prayer of release. With each word, the chains glow. You swing the silver dagger, cutting them. The ghosts cry out in joy. Graves screams, \"No!\" The shadows retreat, and he is dragged into the cage, which collapses. The asylum trembles.",
        scene: "The prayer fills the chamber with light while the cage and chains collapse around Dr. Graves.",
        choices: [
          { text: "Escape with Mary and the freed ghosts.", next: "asylum_ending_good" },
        ],
      },
      asylum_reason_graves: {
        text: "You lower the dagger. \"Dr. Graves, why do you keep them here?\" He hesitates. \"They were my patients. I tried to cure them... but I failed. Now I cannot let them go.\" You show him the journal. \"Thomas believed in forgiveness. Let them go, and you can rest too.\" His form softens. \"Perhaps... you are right.\" He releases the chains and fades away.",
        scene: "For the first time, Dr. Graves looks less like a monster and more like a ruined man.",
        choices: [
          { text: "Lead the ghosts out.", next: "asylum_ending_good" },
        ],
      },
      asylum_fight_graves: {
        text: "You charge, but the dagger passes through him. He laughs and lifts you into the air. \"Foolish mortal.\" He hurls you against the wall. You lose consciousness as darkness consumes you.",
        scene: "Dr. Graves rises above you as the chamber walls vanish into shadow.",
        choices: [
          { text: "Darkness takes hold.", next: "asylum_ending_death" },
        ],
      },
      asylum_find_patients: {
        text: "You decide to free other patients first. Mary leads you to a ward where a group of ghost children huddle. One points to a shadowy figure - Nurse Ratchet. You can either sneak past or confront her.",
        scene: "Ghost children huddle nearby while Nurse Ratchet blocks the way forward.",
        choices: [
          { text: "Sneak past the nurse.", next: "asylum_sneak_past" },
          { text: "Confront the nurse.", next: "asylum_confront_nurse" },
        ],
      },
      asylum_sneak_past: {
        text: "You and Mary tiptoe through a service corridor. The children follow. You reach the central chamber unseen, joining the ritual scene.",
        scene: "The service corridor carries you past Nurse Ratchet and back toward the central chamber.",
        choices: [
          { text: "Proceed to the ritual.", next: "asylum_ritual" },
        ],
      },
      asylum_confront_nurse: {
        text: "You step into the nurse's path. She screeches, \"Patients must be controlled!\" You show her Thomas's journal. She pauses, reading. \"He... he cared.\" She lowers her syringe and fades. The children are freed.",
        scene: "Nurse Ratchet falters when she sees Thomas's journal.",
        choices: [
          { text: "Proceed to the central chamber.", next: "asylum_central" },
        ],
      },
      asylum_office_run: {
        text: "You dash toward the warden's office. The footsteps pursue, but you slam the door behind you. Inside, you find the red journal on the desk. As you grab it, the floorboards groan. A ghostly figure rises - the Warden. \"You have what you seek, but you must face me to leave.\"",
        scene: "The Warden rises from the office floorboards while Thomas's journal lies open in your hands.",
        choices: [
          { text: "Fight the Warden.", next: "asylum_fight_warden" },
          { text: "Negotiate with the Warden.", next: "asylum_negotiate_warden" },
        ],
      },
      asylum_fight_warden: {
        text: "You swing the dagger, but it passes through. The Warden engulfs you in shadow. Your mind fills with fear, and you collapse.",
        scene: "The Warden's shadow closes over the office and crushes the light.",
        choices: [
          { text: "Submit to the Warden.", next: "asylum_ending_warden" },
        ],
      },
      asylum_negotiate_warden: {
        text: "You lower your weapon. \"I only want to free the patients.\" The Warden pauses. \"I am bound to this place, but I hate Graves. Help me find peace, and I will let you pass.\"",
        scene: "The Warden hovers between threat and ally while the office air grows still.",
        choices: [
          { text: "Agree to help the Warden.", next: "asylum_help_warden" },
          { text: "Refuse and try to escape.", next: "asylum_escape_warden" },
        ],
      },
      asylum_help_warden: {
        text: "The Warden tells you that Dr. Graves's power comes from a dark amulet hidden in his office. Destroy it, and Graves will weaken. You find the amulet, smash it with the dagger, and the asylum begins to crumble. The Warden fades with a sigh of relief. You escape with the patients.",
        scene: "The dark amulet shatters and the asylum begins to collapse around you.",
        choices: [
          { text: "Escape with the patients.", next: "asylum_ending_good" },
        ],
      },
      asylum_escape_warden: {
        text: "You bolt out the door, but the Warden's shadows chase you. You run blindly through corridors and find an exit, but the asylum follows you in your dreams forever.",
        scene: "You burst into the night while the asylum's shadow clings to your thoughts.",
        choices: [
          { text: "Run for the gate.", next: "asylum_ending_haunted" },
        ],
      },
      asylum_main: {
        text: "You enter the main hall. Cobwebs drape from a chandelier. A portrait of Dr. Graves watches you. As you pass, the eyes follow. A door slams behind you. A booming voice: \"Patient, you are late for your treatment.\" Two doors: one marked \"Office,\" one \"Ward.\" The voice seems to come from the office.",
        scene: "The main hall seals behind you while Dr. Graves's portrait seems to follow every step.",
        choices: [
          { text: "Enter the office.", next: "asylum_office" },
          { text: "Go to the ward.", next: "asylum_ward" },
          { text: "Search the hall first.", next: "asylum_hall_search" },
        ],
      },
      asylum_office: {
        text: "You burst into the office. Dr. Graves's skeleton sits at the desk, a journal open. As you grab it, the room transforms into a torture chamber. Graves appears: \"The secrets die with you!\" He hurls instruments at you.",
        scene: "The office transforms into a torture chamber while Dr. Graves attacks.",
        choices: [
          { text: "Read the journal aloud.", next: "asylum_exorcism" },
          { text: "Fight him with a chair.", next: "asylum_fight" },
        ],
      },
      asylum_exorcism: {
        text: "Your voice trembles as you read the prayer. Light floods the room, and Graves shrieks, dissolving. The spirits of the patients appear, grateful. Mary thanks you and guides you to the exit. The asylum crumbles to dust behind you.",
        scene: "The office explodes with light as the prayer tears Dr. Graves apart.",
        choices: [
          { text: "Step into the dawn.", next: "asylum_ending_good" },
        ],
      },
      asylum_fight: {
        text: "You swing the chair, but it passes through Graves. He laughs, and darkness consumes you. You feel a cold grip on your throat... then nothing.",
        scene: "Your desperate swing cuts empty air before the room vanishes into blackness.",
        choices: [
          { text: "The asylum claims you.", next: "asylum_ending_death" },
        ],
      },
      asylum_ward: {
        text: "You run into the ward - a room of rusted beds. The door locks behind you. Figures rise from the beds, moaning. They surround you, reaching out. There is nowhere left to run.",
        scene: "Rusted beds scrape across the floor as the ward closes around you.",
        choices: [
          { text: "The ward traps you.", next: "asylum_ending_trapped" },
        ],
      },
      asylum_hall_search: {
        text: "You find a hidden panel behind the portrait. Inside is a map of the asylum, showing a secret tunnel that bypasses the basement. You can use it later.",
        scene: "Behind the portrait, the hidden panel reveals a map and a secret tunnel.",
        choices: [
          { text: "Enter the office.", next: "asylum_office" },
          { text: "Use the tunnel.", next: "asylum_tunnel" },
        ],
      },
      asylum_tunnel: {
        text: "You crawl through the narrow passage. It leads to the central chamber, bypassing many dangers. You emerge near the cage where Mary and the other spirits are bound.",
        scene: "The tunnel opens near the iron cage where Mary and the others are bound.",
        choices: [
          { text: "Proceed to the central chamber.", next: "asylum_central" },
        ],
      },
      asylum_basement: {
        text: "You descend into the basement. It's damp and dark. Dr. Graves stands in the centre, wearing a silver key around his neck. \"I knew you'd come.\" He summons shadow minions.",
        scene: "The basement drips and echoes while the silver key hangs around Dr. Graves's neck.",
        choices: [
          { text: "Try to grab the key.", next: "asylum_grab_key" },
          { text: "Use the dagger to cut his chain.", next: "asylum_dagger_graves" },
          { text: "Read the prayer.", next: "asylum_prayer_basement" },
        ],
      },
      asylum_grab_key: {
        text: "You lunge for the key, but Graves's shadows hold you. He laughs and takes the key, then traps you in a cell.",
        scene: "The cell door slams while the key disappears back into Dr. Graves's grasp.",
        choices: [
          { text: "The trap closes.", next: "asylum_ending_trapped" },
        ],
      },
      asylum_dagger_graves: {
        text: "You slash the chain around his neck. He shrieks, and the key falls. You grab it, but Graves flees. You use the key to open the cabinet in the office, then proceed to the ritual.",
        scene: "The key drops free from Dr. Graves's neck as he retreats into the dark.",
        choices: [
          { text: "Proceed to the central chamber.", next: "asylum_central" },
        ],
      },
      asylum_prayer_basement: {
        text: "You recite the prayer. Graves writhes, but the basement itself fights you. The shadows become stronger. You are overwhelmed.",
        scene: "The prayer falters as the basement shadows grow stronger around you.",
        choices: [
          { text: "The darkness overwhelms you.", next: "asylum_ending_overwhelmed" },
        ],
      },
      asylum_confront: {
        text: "You step into the hallway, flashlight raised. A towering shadow with red eyes lunges. You swing, but it passes through you. Mary screams, and the shadow drags her away. You are left alone, hearing her cries forever.",
        scene: "Mary's scream echoes down the east wing as the shadow drags her away.",
        choices: [
          { text: "You cannot reach her.", next: "asylum_ending_alone" },
        ],
      },
      asylum_main_door: {
        text: "The key fits. You enter a grand foyer. A broken wheelchair sits at the bottom of a staircase. A spectral nurse descends, pointing a syringe. \"You need your medicine.\" You dodge and run up the stairs.",
        scene: "The spectral nurse glides down the staircase while the foyer doors slam behind you.",
        choices: [
          { text: "Go to the second floor.", next: "asylum_floor2" },
          { text: "Hide in a closet.", next: "asylum_hide_foyer" },
        ],
      },
      asylum_floor2: {
        text: "The second floor is filled with examination rooms. You hear a child crying from a room labeled \"13.\" Inside, a ghost boy sits on a bed. \"Dr. Graves took my voice. Only the warden's key can set us free.\" He points to a cabinet. Inside is a silver key.",
        scene: "Room 13 glows faintly while the ghost boy points toward the silver key.",
        choices: [
          { text: "Take the silver key.", next: "asylum_silver_key" },
          { text: "Comfort the boy.", next: "asylum_comfort" },
        ],
      },
      asylum_silver_key: {
        text: "You take the key. The boy smiles and fades. The key opens a hidden door in the warden's office, revealing the dagger and journal.",
        scene: "The silver key finally opens the hidden way to the dagger and journal.",
        choices: [
          { text: "Proceed to the central chamber.", next: "asylum_central" },
        ],
      },
      asylum_comfort: {
        text: "You sit beside the boy. \"It's okay. I'll help you.\" He takes your hand and leads you to a room with a glowing orb. \"That's his power. Break it.\" You smash the orb, and the asylum shakes. Graves screams, and the ghosts fade in peace.",
        scene: "The glowing orb shatters and the asylum begins to lose its hold.",
        choices: [
          { text: "Leave the asylum behind.", next: "asylum_ending_good" },
        ],
      },
      asylum_hide_foyer: {
        text: "You hide in a closet. The nurse passes. You wait until silence, then find a staircase leading to the basement, where you encounter Dr. Graves directly.",
        scene: "The closet hides you just long enough to reveal the basement stairs.",
        choices: [
          { text: "Proceed to the basement.", next: "asylum_basement" },
        ],
      },
      asylum_ending_good: {
        text: "You escape as dawn breaks. The asylum is gone, and the land becomes peaceful. You write the story, and the disappearances cease.",
        scene: "Dawn breaks over the ruins where Blackwood Asylum once stood.",
        end: true,
      },
      asylum_ending_trapped: {
        text: "Your mind slips away. You become one of the asylum's permanent residents, lost in your own nightmare.",
        scene: "The halls of Blackwood Asylum close around you forever.",
        end: true,
      },
      asylum_ending_death: {
        text: "Your body is never found. The asylum claims another victim.",
        scene: "The darkness leaves no trace of what happened to you.",
        end: true,
      },
      asylum_ending_warden: {
        text: "You become a servant of the Warden, forever wandering the halls.",
        scene: "The Warden's shadow settles over you and never lifts.",
        end: true,
      },
      asylum_ending_haunted: {
        text: "You escape but are haunted by the asylum in your dreams, unable to live a normal life.",
        scene: "You leave the grounds, but Blackwood Asylum follows you into every night.",
        end: true,
      },
      asylum_ending_alone: {
        text: "You are trapped, forever hearing Mary's cries.",
        scene: "Mary's voice echoes through the east wing without end.",
        end: true,
      },
      asylum_ending_overwhelmed: {
        text: "The darkness consumes you, and you join the shadows.",
        scene: "The basement swallows your voice and leaves only darkness behind.",
        end: true,
      },
      asylum_ending_escape_but_curse_remains: {
        text: "You flee with the journal, but the curse persists, and you spend your life trying to find a way to finish the ritual.",
        scene: "You escape the asylum, but the curse remains behind you.",
        end: true,
      },
    },
  },
  whisperingWoods: {
    name: "The Whispering Woods",
    genreKey: "horror",
    genreName: "Horror",
    cardTag: "Horror 02",
    summary: "Lost in cursed woods, you can help Lily, bargain with spirits, and decide whether the witch keeps her trapped souls forever.",
    preview: "Blue fireflies, deceptive spirits, a witch's hut, and forest paths that shift in the mist.",
    scene: "The trail is gone, the mist is rising, and three haunted paths wait under whispering branches.",
    nodes: {
      start: {
        text: "The trail vanished hours ago. Now the trees press close, their branches like gnarled fingers. A cold mist snakes through the undergrowth. A whisper brushes your ear: \"Come... come...\" Ahead, three paths diverge: one lit by bobbing blue fireflies, one dark and silent, and a third almost hidden behind a massive oak. A carving on the oak reads: \"Beware the lights - they lead to the witch.\"",
        scene: "Three paths split under the oak while cold mist moves through the roots around your boots.",
        choices: [
          { text: "Follow the fireflies.", next: "woods_fireflies" },
          { text: "Take the dark path.", next: "woods_dark" },
          { text: "Take the hidden path behind the oak.", next: "woods_hidden" },
          { text: "Examine the carving more closely.", next: "woods_carving" },
        ],
      },
      woods_carving: {
        text: "You trace the words. Beneath them, a faded image of a lantern. Suddenly, a ghostly woodcutter appears, axe in hand. \"Turn back! The witch's servants are the wisps. They'll lead you to your doom. The dark path goes to her hut, but maybe you can find the forest spirit instead.\" He points to the hidden path. \"That way leads to the old hunter's oak. He might help.\"",
        scene: "The carving glows faintly as the ghost woodcutter rises from the roots beside the oak.",
        choices: [
          { text: "Follow the fireflies.", next: "woods_fireflies" },
          { text: "Take the dark path.", next: "woods_dark" },
          { text: "Take the hidden path.", next: "woods_hidden" },
          { text: "Ask the woodcutter about himself.", next: "woods_woodcutter_story" },
        ],
      },
      woods_woodcutter_story: {
        text: "The woodcutter's form flickers. \"I died trying to warn others. The witch caught me and bound me to this tree. Now I can only appear when someone reads my warning.\" He sighs. \"If you meet her, never accept her food or drink. And remember: fire is her weakness.\" He fades.",
        scene: "The woodcutter's ghost flickers like smoke as the warning sinks into the bark behind him.",
        choices: [
          { text: "Follow the fireflies.", next: "woods_fireflies" },
          { text: "Take the dark path.", next: "woods_dark" },
          { text: "Take the hidden path.", next: "woods_hidden" },
        ],
      },
      woods_fireflies: {
        text: "You follow the fireflies deeper into the woods. They lead you to a clearing where a little girl sits crying. \"I can't find my way home,\" she sobs. \"The witch took my parents. Help me, please.\" Her form flickers - she's a ghost. In the distance, you hear cackling. The fireflies gather, forming a pathway toward a cottage.",
        scene: "Blue fireflies circle the clearing while Lily cries and the witch's cottage waits deeper in the woods.",
        choices: [
          { text: "Promise to help the girl.", next: "woods_help" },
          { text: "Run away from the cottage.", next: "woods_run" },
          { text: "Ask the girl about the witch.", next: "woods_ask_girl" },
          { text: "Follow the fireflies toward the cottage.", next: "woods_fireflies_cottage" },
        ],
      },
      woods_ask_girl: {
        text: "The girl - Lily - whispers, \"The witch collects lost souls. She keeps them in jars. My parents are there. But there's a spirit in the woods that can help if you offer something precious.\" She looks at your necklace.",
        scene: "Lily's ghost flickers in the clearing while the fireflies pulse brighter around your necklace.",
        choices: [
          { text: "Offer your necklace to find the spirit.", next: "woods_spirit" },
          { text: "Try to rescue the parents yourself.", next: "woods_rescue" },
          { text: "Ask Lily to come with you.", next: "woods_lily_follow" },
        ],
      },
      woods_help: {
        text: "You take Lily's hand. She leads you to the witch's hut. Inside, you see jars of glowing souls on shelves. The spell book lies on a table. The witch appears, cackling: \"Another soul for my collection!\"",
        scene: "The witch's hut reeks of smoke and old magic while jars of trapped souls glow along the walls.",
        choices: [
          { text: "Burn the spell book.", next: "woods_burn" },
          { text: "Trade yourself for Lily.", next: "woods_sacrifice" },
          { text: "Distract the witch and grab a jar.", next: "woods_grab_jar" },
        ],
      },
      woods_burn: {
        text: "You seize the spell book and hurl it into the hearth. The pages flare green, and the witch shrieks as flames race across her hut. Lily grabs your arm and points to the black acorn hanging above the cauldron. You knock it into the fire, and the witch dissolves into ash.",
        scene: "The burning spell book floods the hut with light while the black acorn cracks in the flames.",
        choices: [
          { text: "Flee the collapsing hut.", next: "woods_ending_freedom" },
        ],
      },
      woods_sacrifice: {
        text: "You step in front of Lily. \"Take me instead.\" The witch grins and accepts. Lily escapes into the night, but roots coil around your legs and drag you toward the shelves. Your last sight is Lily running free while your own soul is sealed into glass.",
        scene: "The witch's grin widens as the jars glow brighter around you.",
        end: true,
      },
      woods_grab_jar: {
        text: "You kick a stool into the witch's cauldron, and while she shrieks in anger, you snatch the nearest glowing jar from the shelf and run into the woods. Inside, Lily's face appears, pleading for you not to drop it.",
        scene: "You burst back into the forest clutching a glowing soul jar while the witch screams behind you.",
        choices: [
          { text: "Smash the jar.", next: "woods_smash_jar" },
          { text: "Carry the jar and look for the forest spirit.", next: "woods_spirit_with_jar" },
        ],
      },
      woods_run: {
        text: "You flee through the woods, but the fireflies guide you back to the cottage. The witch's laughter follows. You trip over a root, and the ground opens. You fall into darkness.",
        scene: "The fireflies loop back on themselves until the forest floor disappears beneath you.",
        choices: [
          { text: "The woods swallow you.", next: "woods_ending_trapped" },
        ],
      },
      woods_fireflies_cottage: {
        text: "You walk toward the cottage. The fireflies swirl around the door, which creaks open. Inside, the witch sits by a fire, stirring a cauldron. \"Come in, lost one. I have food and warmth.\" She offers a bowl of stew.",
        scene: "Warm light spills from the cottage while the witch stirs the cauldron and smiles too kindly.",
        choices: [
          { text: "Accept the stew.", next: "woods_eat_stew" },
          { text: "Refuse and demand to leave.", next: "woods_refuse" },
          { text: "Pretend to accept but throw it in the fire.", next: "woods_trick" },
        ],
      },
      woods_eat_stew: {
        text: "You take a bite. Instantly your vision blurs. You feel yourself shrinking, turning into a wisp of light. The witch laughs, \"Another soul for my collection.\" She places you in a jar on the shelf. You join Lily's parents, trapped forever.",
        scene: "The bowl slips from your hands as your body becomes a trapped light inside the witch's jar room.",
        choices: [
          { text: "The jar seals shut.", next: "woods_ending_jarred" },
        ],
      },
      woods_refuse: {
        text: "You step back. \"I'm not hungry.\" The witch's face twists. \"Then you shall be my servant.\" She raises her hand, and roots erupt from the floor, binding you. You are dragged into the cellar, where you slowly lose your will.",
        scene: "Roots burst from the floorboards and drag you toward the cellar door.",
        choices: [
          { text: "The cellar claims you.", next: "woods_ending_servant" },
        ],
      },
      woods_trick: {
        text: "You take the bowl, then hurl it into the fireplace. The stew sizzles, and the fire roars. The witch shrieks, \"Fire!\" She retreats, and you grab a jar from the shelf. Lily's face appears inside it. You run out, clutching the jar.",
        scene: "The fireplace erupts and Lily's soul glows inside the jar you carry into the forest.",
        choices: [
          { text: "Smash the jar.", next: "woods_smash_jar" },
          { text: "Carry the jar and look for the forest spirit.", next: "woods_spirit_with_jar" },
        ],
      },
      woods_smash_jar: {
        text: "You smash the jar on a rock. Light erupts, and Lily's form materializes. \"Thank you! Now we must break the others!\" But the witch recovers and casts a spell that turns the trees into claws. You and Lily flee.",
        scene: "Splintered glass and soul-light burst across the forest floor as the witch's spell twists the trees.",
        choices: [
          { text: "Continue to escape.", next: "woods_escape_with_lily" },
        ],
      },
      woods_spirit_with_jar: {
        text: "You run through the forest, the jar glowing in your hands. You find the Forest Spirit's oak. The stag appears. \"You carry one of her souls. Give it to me, and I can free it and help you.\"",
        scene: "The Forest Spirit waits beneath the oak while the soul jar pulses like a heartbeat in your hands.",
        choices: [
          { text: "Give the jar to the spirit.", next: "woods_spirit_ritual" },
          { text: "Keep the jar and demand the spirit's help.", next: "woods_demand_help" },
        ],
      },
      woods_demand_help: {
        text: "The spirit's eyes harden. \"I do not respond to demands.\" It fades, and you are left alone. The witch finds you and captures you.",
        scene: "The oak goes still as the Forest Spirit abandons you to the witch.",
        choices: [
          { text: "The witch catches you.", next: "woods_ending_trapped" },
        ],
      },
      woods_spirit_ritual: {
        text: "The spirit touches the jar, and it shatters, releasing Lily. She thanks you, then the spirit speaks: \"To end the witch, you must destroy her heart - a blackened acorn she keeps in her hut. I will give you a torch that never goes out.\"",
        scene: "The soul jar breaks in the Forest Spirit's light as Lily is finally freed beside the oak.",
        choices: [
          { text: "Take the torch and return to the hut.", next: "woods_return_to_hut" },
          { text: "Ask the spirit to help you directly.", next: "woods_spirit_direct" },
        ],
      },
      woods_return_to_hut: {
        text: "Armed with the eternal torch, you sneak back to the hut. The witch is tending her cauldron. You find the black acorn on a shelf and thrust the torch into it. It explodes with light, and the witch dissolves. The forest is freed.",
        scene: "The eternal torch strikes the black acorn and the witch's power collapses in one burst of light.",
        choices: [
          { text: "Watch the forest awaken.", next: "woods_ending_freedom" },
        ],
      },
      woods_spirit_direct: {
        text: "The spirit sighs. \"I cannot directly interfere, but I can create a diversion.\" It sends a stampede of deer to the hut. While the witch is distracted, you slip in, destroy the acorn, and escape.",
        scene: "The forest spirit's deer thunder through the clearing while you slip past the witch's gaze.",
        choices: [
          { text: "Leave the hut behind.", next: "woods_ending_freedom" },
        ],
      },
      woods_dark: {
        text: "You take the dark path. The trees lean close, branches scraping your arms. You stumble over a root and fall into a pit. When you wake, you're in a cage. The witch peers in: \"A fresh one. You'll make a fine addition.\" She cackles and leaves. In the next cage, a child whispers, \"The key is around her neck...\"",
        scene: "You wake inside a cage in the witch's cellar while another trapped child whispers beside you.",
        choices: [
          { text: "Wait for the witch and grab the key.", next: "woods_cage_fight" },
          { text: "Try to pick the lock with a twig.", next: "woods_lockpick" },
          { text: "Call for help.", next: "woods_call" },
          { text: "Examine the cage for weak spots.", next: "woods_examine_cage" },
        ],
      },
      woods_examine_cage: {
        text: "You find a loose bar near the floor. You work it back and forth, and eventually it comes free. You squeeze through, then help the child. Together you sneak away while the witch is gone.",
        scene: "The cage bar finally loosens and the cellar opens into the forest beyond.",
        choices: [
          { text: "Escape with the child.", next: "woods_escape_with_child" },
        ],
      },
      woods_cage_fight: {
        text: "When the witch returns, you grab the key from her neck. She screeches, and the cage opens. You free the child and run. She leads you to a river, and the witch cannot cross. You find a road and safety.",
        scene: "The stolen key frees the cage as the witch rages helplessly on the riverbank.",
        choices: [
          { text: "Reach the town road.", next: "woods_escape_with_child" },
        ],
      },
      woods_lockpick: {
        text: "You pick the lock and free the child. But as you leave, the witch awakens and casts a binding spell. You push the child to safety, but you are rooted to the ground. The witch captures you.",
        scene: "The cellar door opens, but the witch's binding spell freezes you in place.",
        choices: [
          { text: "You are captured.", next: "woods_ending_captured" },
        ],
      },
      woods_call: {
        text: "You shout for help. The Forest Spirit hears and sends a stag that breaks the cage. But the witch attacks, and you are separated from the child. The stag leads you out, but the child remains behind.",
        scene: "The stag shatters the cage, but the child vanishes back into the witch's darkness.",
        choices: [
          { text: "Escape the woods alone.", next: "woods_ending_escape_without_child" },
        ],
      },
      woods_escape_with_child: {
        text: "You and the child reach a town. The child is reunited with her grandmother, and you learn that she disappeared ten years ago. You become a local hero, but the woods still whisper.",
        scene: "Town lights finally break through the mist as the child reaches safety after ten lost years.",
        choices: [
          { text: "Carry the memory home.", next: "woods_ending_guardian" },
        ],
      },
      woods_hidden: {
        text: "You follow the narrow path to a clearing with a great oak. A majestic stag stands there, antlers glowing. The Forest Spirit speaks: \"The witch grows strong. I cannot defeat her alone. Bring me her spell book from her hut, and I will banish her. But beware - she will try to deceive you.\"",
        scene: "The Forest Spirit waits beneath the great oak where the hidden path finally opens.",
        choices: [
          { text: "Agree to get the spell book.", next: "woods_spirit_quest" },
          { text: "Ask for another way.", next: "woods_ask_another" },
          { text: "Try to bargain with the spirit.", next: "woods_bargain" },
        ],
      },
      woods_ask_another: {
        text: "The spirit lowers its head. \"There is an old hermit in the woods. He knows a ritual to weaken the witch. Find his cabin and bring me the herbs he grows.\"",
        scene: "The stag's antlers dim as it sends you toward the hermit's cabin.",
        choices: [
          { text: "Find the hermit's cabin.", next: "woods_hermit" },
          { text: "Still try to get the spell book.", next: "woods_spirit_quest" },
        ],
      },
      woods_bargain: {
        text: "\"What will you give me in return?\" The spirit says, \"Your memory of the way out. You will wander these woods forever, but you will be safe.\"",
        scene: "The Forest Spirit offers safety at the cost of ever leaving the woods behind.",
        choices: [
          { text: "Accept the bargain.", next: "woods_ending_wander" },
          { text: "Refuse and find the spell book.", next: "woods_spirit_quest" },
        ],
      },
      woods_spirit_quest: {
        text: "You creep toward the witch's hut. Inside, you see the spell book on the table. As you reach for it, the witch appears: \"Thief!\" She casts a spell, but you grab the book and run. You stumble back to the oak, where the spirit takes the book and begins a ritual.",
        scene: "You snatch the spell book and race back to the oak while the witch's spell tears through the trees behind you.",
        choices: [
          { text: "Help the spirit.", next: "woods_spirit_ritual" },
        ],
      },
      woods_hermit: {
        text: "You find a small cabin deep in the woods. An old man sits on the porch, whittling. \"I know why you're here. The witch has plagued this forest for centuries. I have herbs that can drive her away, but they must be burned in her hearth.\" He gives you a pouch of dried herbs.",
        scene: "The hermit's cabin glows softly in the mist as he hands you the dried herbs.",
        choices: [
          { text: "Sneak into the hut and burn the herbs.", next: "woods_burn_herbs" },
          { text: "Ask the hermit to come with you.", next: "woods_hermit_join" },
        ],
      },
      woods_burn_herbs: {
        text: "You approach the hut, find the witch away, and throw the herbs into the fire. Thick smoke fills the room, and the witch's power wanes. The Forest Spirit appears and finishes her.",
        scene: "The hermit's herbs fill the cottage with choking smoke while the witch's magic collapses.",
        choices: [
          { text: "Leave the hut for the last time.", next: "woods_ending_freedom" },
        ],
      },
      woods_hermit_join: {
        text: "The hermit agrees to help. Together you enter the hut, but the witch is ready. She curses the hermit, and he crumbles to dust. You escape, but the witch still lives.",
        scene: "The hermit's sacrifice buys your escape, but the witch's laugh still echoes from the hut.",
        choices: [
          { text: "Run before she recovers.", next: "woods_ending_warned" },
        ],
      },
      woods_rescue: {
        text: "You enter the cottage while the witch is out. You find two jars with adult souls. You smash them, but the noise alerts the witch. She curses you, and you become trapped in a jar yourself.",
        scene: "The shattered soul jars flare with light just before the witch seals you inside one of her own.",
        choices: [
          { text: "The glass closes around you.", next: "woods_ending_jarred" },
        ],
      },
      woods_lily_follow: {
        text: "Lily nods. She leads you to a hidden cave where the Hunter's ghost is trapped in a tree. \"He knows how to kill the witch,\" she says. The Hunter's spirit appears: \"I tried to burn her, but she cursed me. You must use silver.\"",
        scene: "The Hunter's spirit writhes inside the old tree while Lily points toward the next path.",
        choices: [
          { text: "Find silver in the woods.", next: "woods_find_silver" },
          { text: "Return to the witch's hut and try fire again.", next: "woods_burn" },
        ],
      },
      woods_find_silver: {
        text: "Lily guides you to an old abandoned camp. Among the ruins, you find a silver knife. Armed with it, you confront the witch. You stab the black acorn, and she dissolves.",
        scene: "The silver knife gleams among the camp ruins before you carry it back to the witch's hut.",
        choices: [
          { text: "Watch the forest heal.", next: "woods_ending_freedom" },
        ],
      },
      woods_spirit: {
        text: "You place your necklace on a stone. The Forest Spirit appears, grateful. \"Your sacrifice frees one of my bonds. I will help you.\" It creates a path of light that leads you directly out of the woods. As you leave, you see Lily and her parents fading into the light.",
        scene: "Your necklace glows on the stone as the Forest Spirit opens a path of light through the mist.",
        choices: [
          { text: "Take the path of light.", next: "woods_ending_escape" },
        ],
      },
      woods_escape_with_lily: {
        text: "You and Lily flee through the forest. She leads you to a river. The witch cannot cross, and you find a road. Lily's parents appear, and together they fade into the light. You return home, but the woods remain in your dreams.",
        scene: "The river blocks the witch while Lily and her parents finally find peace in the light.",
        choices: [
          { text: "Follow the road home.", next: "woods_ending_freedom" },
        ],
      },
      woods_ending_trapped: {
        text: "The woods close around you, and the witch's paths never let you go. Your voice becomes one more whisper calling to lost travelers.",
        scene: "Cold mist fills the pit and the forest seals itself over you.",
        end: true,
      },
      woods_ending_jarred: {
        text: "You are trapped in glass among the witch's collection, glowing on a shelf beside the other lost souls she has stolen.",
        scene: "Your world shrinks to the inside of a soul jar while the witch's fire crackles nearby.",
        end: true,
      },
      woods_ending_servant: {
        text: "The witch drags you into the cellar until your fear becomes obedience. In time, you forget your own name and serve her like all the others she has broken.",
        scene: "Roots and cellar darkness swallow your will until only service remains.",
        end: true,
      },
      woods_ending_captured: {
        text: "You buy the child's freedom with your own. The witch binds you to the forest floor, and soon another lost soul joins her collection.",
        scene: "The child's footsteps fade while the witch's binding spell roots you in place.",
        end: true,
      },
      woods_ending_escape_without_child: {
        text: "You escape the woods, but the child remains behind. Safety feels hollow when you know the witch still has another soul trapped in the dark.",
        scene: "The road appears at last, but the crying child is no longer beside you.",
        end: true,
      },
      woods_ending_guardian: {
        text: "You become known as the one who brought a lost child home. The woods never stop whispering, but now you understand that some spirits stay close not to haunt you, but to guard you.",
        scene: "The town lights shine warm behind you while the forest still murmurs your name.",
        end: true,
      },
      woods_ending_warned: {
        text: "You escape the woods but never forget the hermit's sacrifice. You warn others, and the forest is eventually cleared. The witch is weakened but not destroyed.",
        scene: "The forest edge gives way to daylight, but the witch's shadow survives somewhere behind the trees.",
        end: true,
      },
      woods_ending_wander: {
        text: "You lose your memory of the way out. You wander the woods forever, becoming a ghost that other lost hikers see. You warn them, but you can never leave.",
        scene: "The paths erase themselves behind you until the woods become the only home you remember.",
        end: true,
      },
      woods_ending_escape: {
        text: "You leave the woods alive and changed, carrying the memory of Lily and the spirits you helped. The forest lets you go, but it never quite stops whispering your name.",
        scene: "The path of light leads you back to the world beyond the trees.",
        end: true,
      },
      woods_ending_freedom: {
        text: "The witch is destroyed, the forest blooms, and all the trapped souls are freed. Lily and her parents wave goodbye as they fade into the light. You find your way back to the trail, forever changed.",
        scene: "The whispering woods bloom in fresh light as the last trapped souls finally go free.",
        end: true,
      },
    },
  },
};

let selectedGenreKey = null;
let currentStoryKey = null;

function isReducedMotion() {
  return document.body.classList.contains("reduce-motion")
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function goToTop() {
  window.scrollTo({
    top: 0,
    behavior: isReducedMotion() ? "auto" : "smooth",
  });
}

function showStage(stageKey) {
  Object.entries(stageMap).forEach(([key, element]) => {
    const isActive = key === stageKey;
    element.classList.toggle("hidden", !isActive);
    element.classList.toggle("story-stage-active", isActive);
  });

  goToTop();
}

function renderDefaultPreview() {
  storyImage.classList.remove("story-theme-horror");
  storyImage.classList.remove("story-has-photo");
  storyImage.classList.remove("story-photo-contain");
  storyImage.style.removeProperty("--story-scene-image");
  delete storyImage.dataset.lastSceneImage;
  storyImage.innerHTML = `
    <div class="story-scene">
      <span class="story-scene-label">Story Preview</span>
      <strong class="story-scene-title">Choose a Story</strong>
      <span class="story-scene-copy">Pick Adventure or Horror, then select one story to begin.</span>
    </div>
  `;
}

function resetPlayArea() {
  currentStoryKey = null;
  playTitle.textContent = DEFAULT_PLAY_TITLE;
  playCopy.textContent = DEFAULT_PLAY_COPY;
  storyBox.textContent = DEFAULT_STORY_TEXT;
  choiceList.innerHTML = "";
  replayBtn.hidden = true;
  renderDefaultPreview();
}

function getStoryCardPreview(storyKey) {
  const previewImage = resolveSceneImage(storyKey, "start");
  const storyImageConfig = storyImageConfigs[storyKey];
  return {
    previewImage,
    fitMode: storyImageConfig?.fitMode || "cover",
  };
}

function renderStoryCards(genreKey) {
  const genre = storyGenres[genreKey];
  if (!genre) return;

  selectedGenreKey = genreKey;
  storySelectTitle.textContent = `${genre.name} Stories`;
  storySelectCopy.textContent = genre.description;
  storyOptionGrid.innerHTML = "";

  genre.stories.forEach((storyKey) => {
    const story = stories[storyKey];
    const { previewImage, fitMode } = getStoryCardPreview(storyKey);
    const previewClasses = [
      "story-card-preview",
      previewImage ? "has-image" : "",
      previewImage && fitMode === "contain" ? "is-contain" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const storyCard = document.createElement("article");
    storyCard.className = "story-card";
    storyCard.dataset.genre = genreKey;
    storyCard.innerHTML = `
      <div class="${previewClasses}">
        ${previewImage ? `<img class="story-card-preview-image${fitMode === "contain" ? " is-contain" : ""}" src="${previewImage}" alt="${story.name} preview">` : ""}
        <span>${story.preview}</span>
      </div>
      <div class="story-card-body">
        <span class="story-card-tag">${story.cardTag}</span>
        <h4>${story.name}</h4>
        <p>${story.summary}</p>
        <div class="story-card-footer">
          <span class="story-card-meta">Genre: ${story.genreName}</span>
          <button class="btn primary" type="button">Choose Story</button>
        </div>
      </div>
    `;

    storyCard.querySelector("button").addEventListener("click", () => startStory(storyKey));
    storyOptionGrid.appendChild(storyCard);
  });

  showStage("select");
}

function resolveSceneImage(storyKey, nodeId, previousNodeId) {
  const storyImageConfig = storyImageConfigs[storyKey];
  if (!storyImageConfig) {
    return null;
  }

  const sceneImage = storyImageConfig.nodes[nodeId];
  if (!sceneImage) {
    return null;
  }

  if (typeof sceneImage === "number") {
    return `${storyImageConfig.basePath}/${sceneImage}.${storyImageConfig.extension}`;
  }

  const imageNumber = sceneImage[previousNodeId] || sceneImage.default;
  return imageNumber
    ? `${storyImageConfig.basePath}/${imageNumber}.${storyImageConfig.extension}`
    : null;
}

function renderStoryScene(story, node, nodeId, previousNodeId) {
  const resolvedSceneImage = resolveSceneImage(currentStoryKey, nodeId, previousNodeId);
  const sceneImage = resolvedSceneImage || storyImage.dataset.lastSceneImage || "";
  const storyImageConfig = storyImageConfigs[currentStoryKey];
  const useContainPhoto = Boolean(sceneImage) && storyImageConfig?.fitMode === "contain";
  storyImage.classList.toggle("story-theme-horror", story.genreKey === "horror");
  storyImage.classList.toggle("story-has-photo", Boolean(sceneImage));
  storyImage.classList.toggle("story-photo-contain", useContainPhoto);
  if (sceneImage) {
    storyImage.style.setProperty("--story-scene-image", `url("${sceneImage}")`);
    storyImage.dataset.lastSceneImage = sceneImage;
  } else {
    storyImage.style.removeProperty("--story-scene-image");
    delete storyImage.dataset.lastSceneImage;
  }
  storyImage.innerHTML = `
    ${sceneImage ? `<img class="story-scene-photo" src="${sceneImage}" alt="${story.name} scene">` : ""}
    <div class="story-scene">
      <span class="story-scene-label">${node.end ? `${story.genreName} Ending` : `${story.genreName} Story`}</span>
      <strong class="story-scene-title">${story.name}</strong>
      <span class="story-scene-copy">${node.scene || story.scene}</span>
    </div>
  `;
}

function showNode(nodeId, previousNodeId = null) {
  const story = stories[currentStoryKey];
  if (!story) return;

  const node = story.nodes[nodeId];
  if (!node) return;

  storyBox.textContent = node.text;
  renderStoryScene(story, node, nodeId, previousNodeId);
  choiceList.innerHTML = "";

  if (node.end) {
    if (storySessionActive) {
      recordGameHistory({
        game: story.name,
        action: "Ending Reached",
        details: `Genre: ${story.genreName} | ${node.scene || "Story ending reached."}`,
      });
      storySessionActive = false;
    }
    replayBtn.hidden = false;
    return;
  }

  replayBtn.hidden = true;
  node.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === 0 ? "btn primary" : "btn";
    button.textContent = choice.text;
    button.addEventListener("click", () => showNode(choice.next, nodeId));
    choiceList.appendChild(button);
  });
}

function startStory(storyKey) {
  const story = stories[storyKey];
  if (!story) return;

  currentStoryKey = storyKey;
  playTitle.textContent = story.name;
  playCopy.textContent = `Genre: ${story.genreName}. Make choices to move through the story.`;
  showStage("play");
  storySessionActive = true;
  recordGameHistory({
    game: story.name,
    action: "Started",
    details: `Genre: ${story.genreName}`,
  });
  showNode("start");
}

function backToGenres() {
  selectedGenreKey = null;
  resetPlayArea();
  showStage("genre");
}

function backToStories() {
  resetPlayArea();
  if (selectedGenreKey) {
    showStage("select");
    return;
  }
  showStage("genre");
}

genreButtons.forEach((button) => {
  button.addEventListener("click", () => renderStoryCards(button.dataset.genreSelect));
});

backToGenresBtn.addEventListener("click", backToGenres);
backToListBtn.addEventListener("click", backToStories);
changeGenreBtn.addEventListener("click", backToGenres);

replayBtn.addEventListener("click", () => {
  if (!currentStoryKey) return;
  const story = stories[currentStoryKey];
  if (story) {
    storySessionActive = true;
    recordGameHistory({
      game: story.name,
      action: "Replayed",
      details: `Genre: ${story.genreName}`,
    });
  }
  showNode("start");
});

if (backToTopButton) {
  const toggleBackToTop = () => {
    backToTopButton.classList.toggle("visible", window.scrollY > 220);
  };

  backToTopButton.addEventListener("click", goToTop);
  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  toggleBackToTop();
}

resetPlayArea();
showStage("genre");
})();
