// «Favola 10» — десять сказок для «Прочитать готовую сказку» на всех языках приложения.
// Британские, европейские и еврейские сюжеты, которые никому не принадлежат: народные
// сказки, легенды и сказки авторов, умерших более ста лет назад. Тексты написаны заново
// (это не перепечатка чьих-либо пересказов или переводов). Английский текст — исходный;
// другие языки мотор переводит сам при первом открытии и запоминает. Картинки общие
// для всех языков: число абзацев в переводе сохраняется.
export const F10_LANGS = ['ru', 'en', 'pt', 'es', 'de', 'zh', 'lt'];
import { LITHUANIAN10 } from './lithuanian10.js';
export const FAVOLA10 = [
{ id: 'f10-three-pigs', origin: 'Britain', estMinutes: 3,
  source: 'English folk tale, printed by Joseph Jacobs in "English Fairy Tales" (1890)',
  titles: { ru: 'Три поросёнка', en: 'The Three Little Pigs', pt: 'Os Três Porquinhos', es: 'Los tres cerditos', de: 'Die drei kleinen Schweinchen', zh: '三只小猪', lt: 'Trys paršiukai' },
  text: `Once upon a time, three little pigs left their mother's farm to build homes of their own. "Build them strong," she called after them, "and visit me on Sundays."

The first little pig was in a hurry. He met a man carrying straw and built a house of straw in one afternoon. "Done!" he sang, and lay down for a nap in the sun.

The second little pig was a little less hurried. He found a cart of sticks and built a house of sticks by evening. It creaked in the breeze, but he liked the sound.

The third little pig took her time. She bought bricks, mixed mortar and worked for many days, while her brothers laughed and played. "Bricks are slow," they said. "Bricks are strong," she answered.

One night a hungry wolf came by. He huffed and he puffed, and the straw house flew away like a dandelion. He huffed and he puffed again, and the sticks fell down like a game of pick-up sticks. The two pigs ran as fast as they could to their sister's door.

The wolf huffed and puffed at the brick house until his cheeks were red and his breath was gone. The house did not move at all. At last he tried the chimney, but the third little pig had a pot of hot water bubbling below, and the wolf jumped back out and ran away into the woods, never to return.

That winter the three pigs lived together in the warm brick house. In spring the two brothers built brick houses of their own, slowly and carefully, and every Sunday all three visited their mother.` },
{ id: 'f10-magpie-nest', origin: 'Britain', estMinutes: 3,
  source: 'English folk tale, printed by Joseph Jacobs in "English Fairy Tales" (1890)',
  titles: { ru: 'Гнездо сороки', en: "The Magpie's Nest", pt: 'O Ninho da Pega', es: 'El nido de la urraca', de: 'Das Nest der Elster', zh: '喜鹊的窝', lt: 'Šarkos lizdas' },
  text: `Long ago, when the world was young, the birds did not know how to build nests. They slept on bare branches and laid their eggs wherever they could. Only Madge the Magpie knew the secret.

One morning all the birds flew to Madge's tree. "Please," they chirped, "teach us how to build a nest." Madge fluffed her black and white feathers. "Very well," she said. "Watch closely."

She took some mud and made a little round cake. "Oh, that's how it's done!" said the thrush, and flew off. And that is why thrushes' nests are lined with mud to this very day.

Then Madge took some twigs and laid them around the mud. "Now I know it all!" cried the blackbird, and away she went. And that is why blackbirds' nests are made of twigs and mud.

Madge laid more twigs on top. "That's quite enough for me," said the owl, blinking, and he flew off and never learned any more. Owls' nests are still rather untidy.

Madge wove in soft feathers and wool. "Oh, that suits me!" said the sparrow, and off he flew. One by one the birds left, each sure they knew everything, until only the turtle dove was still there, not listening at all. "Take two, Taffy, take two," she cooed.

"One's enough!" said Madge crossly, and flew away. The turtle dove never learned to build properly, and her nest is just a few sticks. And that is why every bird builds a different nest — each one stopped listening at a different moment.` },
{ id: 'f10-whittington-cat', origin: 'Britain', estMinutes: 4,
  source: 'English legend about Richard Whittington, Lord Mayor of London (14th–15th century)',
  titles: { ru: 'Дик Уиттингтон и его кошка', en: 'Dick Whittington and His Cat', pt: 'Dick Whittington e o seu Gato', es: 'Dick Whittington y su gato', de: 'Dick Whittington und seine Katze', zh: '迪克·惠廷顿和他的猫', lt: 'Dikas Vitingtonas ir jo katė' },
  text: `Long ago a poor boy called Dick heard that the streets of London were paved with gold. So he walked all the way to the great city with nothing but a stick and a hungry stomach.

The streets were muddy, not golden. Dick was cold and tired, until a kind merchant, Mr Fitzwarren, found him on his doorstep and gave him work in his kitchen. Dick slept in a little attic full of mice that scampered over him all night.

With his first penny, Dick bought a cat. She was small and grey, with a white tip on her tail, and she chased every mouse away. At night she curled up on Dick's chest, purring like a kettle.

One day Mr Fitzwarren's ship was ready to sail to faraway lands. Everyone in the house could send something to trade. Dick had only his cat. With a heavy heart he gave her to the captain.

Months later the ship reached a kingdom overrun by mice. They ran across the king's table and nibbled the queen's slippers. When the captain set down Dick's cat, she cleared the palace in one evening. The king was so delighted that he paid for her with a chest of gold.

Meanwhile Dick, sad and lonely, had decided to leave London. As he climbed a hill, the bells of the city began to ring, and they seemed to sing, "Turn again, Whittington, Lord Mayor of London." So he turned around and went back.

When the ship came home, the gold was his. Dick shared it with everyone who had been kind to him, went to school, worked hard, and many years later he truly became Lord Mayor of London. And there was always a cat asleep by his fire.` },
{ id: 'f10-bremen', origin: 'Europe', estMinutes: 4,
  source: 'German folk tale, collected by the Brothers Grimm (1819)',
  titles: { ru: 'Бременские музыканты', en: 'The Bremen Town Musicians', pt: 'Os Músicos de Bremen', es: 'Los músicos de Bremen', de: 'Die Bremer Stadtmusikanten', zh: '不莱梅的音乐家', lt: 'Brėmeno muzikantai' },
  text: `Once there was a donkey who had carried sacks to the mill for many years. Now he was old and slow, and his farmer no longer wanted him. "I'll go to Bremen," said the donkey, "and become a town musician."

On the road he met a tired old dog. "Come with me," said the donkey. "I'll play the lute, and you can beat the drum." Soon they met a cat with a face as long as three rainy days, and then a rooster crowing his heart out on a gate. "Come to Bremen with us," they said. "You can all sing."

Bremen was far away, and night fell in the forest. In the distance they saw a light. It was a little house, and through the window they saw robbers sitting at a table full of food.

The four friends made a plan. The donkey put his front hooves on the windowsill, the dog climbed on the donkey's back, the cat climbed on the dog, and the rooster perched on the cat's head. Then all together they began their music: the donkey brayed, the dog barked, the cat miaowed and the rooster crowed.

The robbers thought a monster had come, and ran off into the woods. The animals ate a wonderful supper and went to sleep — the donkey in the yard, the dog behind the door, the cat by the warm stove and the rooster up on the roof.

Later one robber crept back to look. In the dark the cat scratched him, the dog nipped his leg, the donkey gave him a kick, and the rooster shouted, "Cock-a-doodle-doo!" The robber ran and never came back.

The four musicians liked the little house so much that they never went to Bremen at all. They lived there together, and every evening they gave a concert just for themselves.` },
{ id: 'f10-elves-shoemaker', origin: 'Europe', estMinutes: 3,
  source: 'German folk tale, collected by the Brothers Grimm (1812)',
  titles: { ru: 'Эльфы и сапожник', en: 'The Elves and the Shoemaker', pt: 'Os Duendes e o Sapateiro', es: 'Los duendes y el zapatero', de: 'Die Wichtelmänner', zh: '小精灵和鞋匠', lt: 'Nykštukai ir batsiuvys' },
  text: `Once there was a good shoemaker who had grown very poor. One evening he had only enough leather left for a single pair of shoes. He cut it out carefully, laid it on his workbench, and went to bed.

In the morning he could hardly believe his eyes. On the bench stood a finished pair of shoes, with stitches so tiny and neat that it looked like magic. A customer came in, loved them, and paid enough for leather for two more pairs.

That night he cut out two pairs and left them on the bench. In the morning they were finished too, just as beautifully. And so it went on, night after night, until the shoemaker and his wife had enough of everything again.

One evening before Christmas his wife said, "Let's stay up and see who helps us." They hid behind a curtain. At midnight two tiny elves came dancing in, sat at the bench and sewed and hammered with quick little hands until all the shoes were done.

"They have helped us so much," said the wife, "and they have no clothes at all. They must be cold." So she sewed two little shirts, coats and trousers, and the shoemaker made two pairs of tiny shoes. They laid the gifts on the bench.

At midnight the elves found the clothes. They put them on, laughing with joy, and danced around the room singing, "Now we are fine gentlemen — no more cobblers we!" Then they danced out of the door.

They never came back to make shoes, but the shoemaker did not need them anymore. He worked happily for the rest of his life, and every Christmas he left a little gift on the bench, just in case.` },
{ id: 'f10-stone-soup', origin: 'Europe', estMinutes: 3,
  source: 'European folk tale, told in many countries for centuries',
  titles: { ru: 'Суп из камня', en: 'Stone Soup', pt: 'A Sopa de Pedra', es: 'La sopa de piedra', de: 'Die Steinsuppe', zh: '石头汤', lt: 'Akmenų sriuba' },
  text: `One chilly evening a traveller came into a little village. He was hungry, but every door closed when he knocked. "We have nothing to spare," the villagers said.

So the traveller set up his big iron pot in the square, filled it with water from the well and lit a fire. Then he took a smooth grey stone from his pocket and dropped it in. "Stone soup," he said happily. "The best soup in the world."

A curious girl came closer. "Soup from a stone?" she asked. "Oh yes," said the traveller, stirring. "Though it's even better with a carrot or two." The girl ran home and came back with three carrots.

Then a farmer arrived with onions. "Wonderful," said the traveller. "Onions make stone soup sing." A grandmother brought potatoes, a baker brought a pinch of salt and herbs, and the butcher's boy brought a bone. Soon the whole village stood around the pot, sniffing the warm smell.

When the soup was ready, the traveller filled bowls for everyone. Someone brought bread, someone brought a lantern, and someone began to play the fiddle. The square that had been so empty was full of light and laughter.

"What a magic stone," said the girl. The traveller smiled and fished the stone out of the pot. "The stone is just a stone," he said. "The magic was what everyone put in."

In the morning he gave the stone to the girl and went on his way. And from then on, whenever winter evenings were long, the village made stone soup together.` },
{ id: 'f10-ugly-duckling', origin: 'Europe', estMinutes: 4,
  source: 'Fairy tale by Hans Christian Andersen (1843), public domain',
  titles: { ru: 'Гадкий утёнок', en: 'The Ugly Duckling', pt: 'O Patinho Feio', es: 'El patito feo', de: 'Das hässliche Entlein', zh: '丑小鸭', lt: 'Bjaurusis ančiukas' },
  text: `In the summer, by an old farm, a mother duck sat on her nest. One by one her eggs cracked, and out came fluffy yellow ducklings. But the biggest egg took longest of all, and the bird that came out was large, grey and clumsy.

"How strange he looks," quacked the other ducks. The hens pecked at him and the farm cat hissed. Even his brothers and sisters said, "Go away, you ugly thing." The little grey duckling felt that he did not belong anywhere.

So one morning he ran away. He lived among the reeds of a wild marsh, where the wild ducks laughed at him too. Then autumn came, the leaves turned brown, and one evening he saw a flock of beautiful white birds flying south. He did not know their name, but he loved them with all his heart.

Winter was long and cold. The duckling hid in the reeds, swam in a smaller and smaller circle so the water would not freeze, and dreamed about the white birds. A kind farmer once carried him home to warm up, but he was frightened by the children and flew away again.

At last spring came. The sun was warm, the apple trees blossomed, and the duckling found that his wings were strong. He flew to a garden with a lake, and there he saw three of the beautiful white birds gliding on the water.

He swam towards them, bowing his head. And in the clear water he saw his own reflection. He was no longer a clumsy grey bird. He was a swan, white and graceful, just like them.

The swans swam around him and touched him gently with their beaks. Children threw bread and cried, "Look, a new swan — the most beautiful of all!" And the young swan was very happy, but not proud, because a good heart never becomes proud.` },
{ id: 'f10-worse', origin: 'Jewish', estMinutes: 3,
  source: 'Jewish (Yiddish) folk tale, told in Eastern Europe for generations',
  titles: { ru: 'Могло быть и хуже', en: 'It Could Always Be Worse', pt: 'Podia Sempre Ser Pior', es: 'Siempre podría ser peor', de: 'Es könnte immer schlimmer sein', zh: '总可能更糟', lt: 'Visada galėtų būti blogiau' },
  text: `Once upon a time, in a little village, a poor man lived with his wife, his mother and six children in one small room. It was so crowded and noisy that he could not think. So he went to the wise rabbi for advice.

"Rabbi," he said, "my house is so small and so loud that I cannot bear it. What should I do?" The rabbi stroked his beard. "Do you have chickens?" he asked. "Yes." "Then take the chickens into the house."

The man did as he was told. Now the chickens flapped and clucked and laid eggs in his shoes. After a week he came back. "Rabbi, it's worse!" "Do you have a goat?" asked the rabbi. "Yes." "Then take the goat into the house."

The goat chewed the curtains and butted everyone. The man ran back to the rabbi. "It's even worse!" "Do you have a cow?" asked the rabbi. "Bring the cow inside too." And so the cow came in, mooing and stepping on everyone's toes.

At last the poor man could take no more. "Rabbi, help me! The house is full of chickens and a goat and a cow, and we can hardly breathe!" The rabbi nodded kindly. "Now go home," he said, "and let all the animals out."

The man let the chickens, the goat and the cow back into the yard. That night his family stretched out in the quiet room. They could hear each other breathe and laugh. "Our house," said the man, "is so big and so peaceful!"

The next day he went to the rabbi with a happy face. "Thank you," he said. "Now I know: it could always be worse."` },
{ id: 'f10-solomon-bee', origin: 'Jewish', estMinutes: 3,
  source: 'Jewish legend about King Solomon, from the old midrashic tradition',
  titles: { ru: 'Царь Соломон и пчела', en: 'King Solomon and the Bee', pt: 'O Rei Salomão e a Abelha', es: 'El rey Salomón y la abeja', de: 'König Salomo und die Biene', zh: '所罗门王和蜜蜂', lt: 'Karalius Saliamonas ir bitė' },
  text: `Long ago in Jerusalem lived King Solomon, the wisest king of all. He understood the language of birds and animals, and even the tiniest creatures could ask him for justice.

One warm afternoon the king lay down to rest in his garden among the roses. A little bee, buzzing from flower to flower, bumped into his nose and, frightened, stung him. The king woke up with a red, swollen nose.

All the animals were shocked. "Who dared to sting the king?" they cried. The bees were called, and the queen of the bees came forward with the little bee trembling beside her.

"Why did you sting me?" asked Solomon. "I did not mean to, great king," said the bee. "I was afraid. Please let me go, and one day I will help you." The courtiers laughed. "How could a tiny bee ever help the king?" But Solomon smiled and let her go.

Some time later the Queen of Sheba came to test Solomon's wisdom. She brought two bunches of flowers. One was real, the other made by her craftsmen, so perfect that no one could tell them apart. "Which is real?" she asked, and the whole court went quiet.

Solomon looked at the flowers and did not know. Then he heard a soft buzzing at the window. "Open the window," he said. The little bee flew in, circled the room and landed on one bunch, drinking its nectar.

"These are the real flowers," said the king. The Queen of Sheba bowed to his wisdom, and Solomon smiled at the bee. He knew now that no one is too small to help, and that kindness always returns.` },
{ id: 'f10-honi-carob', origin: 'Jewish', estMinutes: 3,
  source: 'Story of Honi the Circle-Maker, from the Babylonian Talmud (Ta\'anit 23a)',
  titles: { ru: 'Хони и рожковое дерево', en: 'Honi and the Carob Tree', pt: 'Honi e a Alfarrobeira', es: 'Honi y el algarrobo', de: 'Honi und der Johannisbrotbaum', zh: '霍尼和角豆树', lt: 'Honis ir saldžiavaisis medis' },
  text: `Long ago in the land of Israel lived a wise man named Honi. He loved to walk along the dusty roads and look at everything around him — the olive trees, the hills, the people at work.

One day he saw an old man kneeling in the earth, planting a tiny carob seedling. "Grandfather," said Honi, "how long will it take for this tree to give fruit?" "Seventy years," answered the old man, patting the soil.

Honi laughed kindly. "Seventy years! Do you think you will be alive to eat its fruit?" The old man looked up and smiled. "When I came into this world, I found carob trees full of fruit. My grandparents planted them for me. Now I plant this one for my grandchildren."

Honi thought about these words as he walked on. The sun was warm, and he sat down under a rock to eat his bread. Soon his eyes grew heavy, and he fell into a deep, deep sleep. The rock hid him, and the years passed quietly over him.

When Honi woke up, he stretched and looked around. Everything seemed a little different. Nearby stood a tall carob tree, heavy with fruit, and a young man was picking the sweet pods. "Did you plant this tree?" asked Honi.

"No," said the young man. "My grandfather planted it, long before I was born." Honi understood that he had slept for seventy years. The little seedling had grown into a great tree, just as the old man had promised.

Honi took a sweet carob pod and tasted it. "Now I see," he said softly. "We are always eating the fruit of someone else's kindness. And we must plant trees for the ones who come after us."` },
];
export const f10Id = (base, lang) => base + '~' + lang;
export function f10Parse(id){ const m = /^((?:f10|lt10)-[a-z0-9-]+)~(ru|en|pt|es|de|zh|lt)$/.exec(String(id || '')); if (!m) return null; const b = FAVOLA10.find(x => x.id === m[1]) || LITHUANIAN10.find(x => x.id === m[1]); return b ? { base: b, lang: m[2] } : null; }
