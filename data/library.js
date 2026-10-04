// «Прочитать сказку»: короткие тексты без прав, для чтения вслух с телесуфлёром.
//
// Это не сканы конкретных изданий, а собственный, короткий пересказ народных
// сюжетов — сами сюжеты (сказка целиком, кто действует, что происходит) очень
// старые и никому не принадлежат. Ниже у каждой сказки указано, откуда взят
// сюжет и почему на него нет прав — на случай если это спросят.
//
//   ru: русские народные сказки, сюжеты — из сборника «Народные русские
//       сказки», который в XIX веке собрал Александр Афанасьев (1826-1871).
//       Сам Афанасьев умер больше ста пятидесяти лет назад, а сказки —
//       безымянный фольклор, старше любого авторского права.
//   en: три сказки собраны и изданы Джозефом Джейкобсом (Joseph Jacobs,
//       1854-1916) в книге «English Fairy Tales» (1890) — с тех пор прошло
//       больше ста тридцати лет; две — совсем безымянный американский и
//       английский фольклор без единого автора; две — басни Эзопа, которым
//       две с половиной тысячи лет.
//
//   Добавлено 26 сентября 2026 (по десять на язык): собственные короткие
//   пересказы авторских сказок, чьи авторы умерли больше семидесяти лет назад
//   (Андерсен, Перро, братья Гримм, Лев Толстой, Ушинский, Киплинг), и
//   «Златовласка» (английский фольклор, впервые напечатан Р. Саути в 1837).
//   Тексты написаны заново, это не перепечатка чьих-то переводов, поэтому
//   прав переводчиков они не касаются.
//
// estMinutes — на глаз, по счёту слов при спокойном чтении вслух.

export const LIBRARY = [
  {
    id: 'ru-repka',
    lang: 'ru',
    title: 'Репка',
    source: 'русская народная сказка, сюжет из сборника А. Н. Афанасьева',
    estMinutes: 2,
    text: `Посадил дед репку. Выросла репка большая-пребольшая.

Пошёл дед репку тянуть: тянет-потянет, вытянуть не может.

Позвал дед бабку. Бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут.

Позвала бабка внучку. Внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут.

Позвала внучка Жучку. Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут.

Позвала Жучка кошку. Кошка за Жучку, Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут.

Позвала кошка мышку. Мышка за кошку, кошка за Жучку, Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут — и вытянули репку!`
  },
  {
    id: 'ru-kurochka-ryaba',
    lang: 'ru',
    title: 'Курочка Ряба',
    source: 'русская народная сказка, сюжет из сборника А. Н. Афанасьева',
    estMinutes: 1,
    text: `Жили-были дед да баба. Была у них курочка Ряба.

Снесла курочка яичко, да не простое — золотое.

Дед бил-бил — не разбил. Баба била-била — не разбила.

Бежала мышка, хвостиком махнула, яичко упало и разбилось.

Дед плачет, баба плачет, а курочка кудахчет:

— Не плачь, дед, не плачь, баба. Снесу вам яичко другое, не золотое — простое.`
  },
  {
    id: 'ru-kolobok',
    lang: 'ru',
    title: 'Колобок',
    source: 'русская народная сказка, сюжет из сборника А. Н. Афанасьева',
    estMinutes: 3,
    text: `Жили-были старик со старухой. Просит старик: «Испеки, старуха, колобок». Наскребла старуха муки, замесила тесто, испекла колобок и положила на окошко студиться.

Полежал колобок, полежал, взял да и покатился — с окна на лавку, с лавки на пол, да в дверь, через порог — да на улицу.

Катится колобок по дороге, а навстречу ему заяц:
— Колобок, колобок, я тебя съем!
— Не ешь меня, косой заяц, я тебе песенку спою, — сказал колобок и спел:
«Я колобок, колобок, по амбару метён, по сусекам скребён, на сметане мешён, в печку сажён, на окошке стужён. Я от дедушки ушёл, я от бабушки ушёл, а от тебя, зайца, и подавно уйду!»
И покатился дальше — только заяц его и видел.

Катится колобок, а навстречу ему волк:
— Колобок, колобок, я тебя съем!
Колобок спел свою песенку и покатился дальше.

Катится колобок, а навстречу ему медведь:
— Колобок, колобок, я тебя съем!
Колобок спел свою песенку и покатился дальше.

Катится колобок, а навстречу ему лиса:
— Колобок, колобок, куда катишься?
Колобок запел свою песенку, а лиса и говорит:
— Какая хорошая песенка, да я стара стала, плохо слышу. Сядь ко мне на носок да спой ещё разок.

Колобок сел лисе на нос и запел снова, а лиса — ам! — и съела его.`
  },
  {
    id: 'ru-teremok',
    lang: 'ru',
    title: 'Теремок',
    source: 'русская народная сказка, сюжет из сборника А. Н. Афанасьева',
    estMinutes: 3,
    text: `Стоит в поле теремок. Бежит мимо мышка-норушка, увидела теремок и спрашивает:
— Терем-теремок! Кто в тереме живёт?
Никто не отзывается. Вошла мышка в теремок и стала там жить.

Прискакала лягушка-квакушка:
— Терем-теремок! Кто в тереме живёт?
— Я, мышка-норушка. А ты кто?
— Я, лягушка-квакушка.
— Иди ко мне жить!
Стали жить вдвоём.

Прибежал зайчик-побегайчик, потом лисичка-сестричка, потом волчок-серый бочок — и каждый спрашивал то же самое, и каждого пускали жить. Стало их пятеро.

Вдруг идёт мимо медведь косолапый, увидел теремок и заревел:
— Терем-теремок! Кто в тереме живёт?
Ему отвечают все звери по очереди.
— И я к вам хочу! — сказал медведь и полез на крышу.

Затрещал теремок, упал набок — и рассыпался.

Успели все выскочить целые и невредимые — мышка-норушка, лягушка-квакушка, зайчик-побегайчик, лисичка-сестричка, волчок-серый бочок. А медведь почесал за ухом и пошёл помогать им строить новый теремок, ещё лучше прежнего.`
  },
  {
    id: 'ru-gusi-lebedi',
    lang: 'ru',
    title: 'Гуси-лебеди',
    source: 'русская народная сказка, сюжет из сборника А. Н. Афанасьева',
    estMinutes: 4,
    text: `Жили муж да жена, и была у них дочка да маленький сынок. Собрались родители в город и наказали дочке:
— Смотри за братцем, со двора не ходи, будем мы в городе — купим тебе платочек.

Ушли родители, а дочка забыла про наказ, посадила братца на травке и убежала играть с подружками. Прилетели гуси-лебеди, подхватили мальчика и унесли на крыльях.

Вернулась девочка, а братца нет. Ахнула она и побежала искать.

Бежит, а навстречу ей печка:
— Печка, печка, скажи, куда гуси-лебеди полетели?
— Съешь моего ржаного пирожка — скажу.
Девочка была разборчива, не съела и побежала дальше.

Так спрашивала она у яблони и у молочной реки с кисельными берегами, и каждый раз просили её сперва отведать угощения, а она отказывалась и бежала дальше.

Долго бежала девочка и увидела наконец избушку на курьих ножках. В избушке сидела баба-яга, а братец играл у неё серебряными яблочками. Улучила девочка минутку, схватила братца и побежала домой.

Гуси-лебеди пустились в погоню. Девочка снова прибежала к молочной реке, к яблоне, к печке — и на этот раз, чтобы спастись, отведала и киселька, и яблочка, и пирожка, и они спрятали её с братцем и не выдали гусям-лебедям.

Прибежала девочка домой с братцем как раз перед возвращением родителей. С тех пор она уже не забывала, что обещала.`
  },
  {
    id: 'ru-lisa-i-zhuravl',
    lang: 'ru',
    title: 'Лиса и журавль',
    source: 'русская народная сказка, сюжет из сборника А. Н. Афанасьева',
    estMinutes: 2,
    text: `Подружились лиса с журавлём и решили в гости друг к другу ходить.

Позвала лиса журавля на обед, наварила манной каши и размазала по тарелке. Журавль клювом стучал-стучал, ничего не попадало — а лиса сама всё слизала.
— Не обессудь, куманёк, больше потчевать нечем, — говорит лиса.
Журавль ушёл голодным.

Позвал журавль лису к себе в гости. Наварил окрошки, налил в кувшин с узким горлышком.
— Кушай, кумушка, не побрезгуй.
Лиса вертелась-вертелась вокруг кувшина, а достать угощение никак не могла.

Так и разошлись друзья ни с чем: как аукнется, так и откликнется.`
  },
  {
    id: 'ru-gadkiy-utyonok',
    lang: 'ru',
    title: "Гадкий утёнок",
    source: "по сказке Ханса Кристиана Андерсена (1805–1875), собственный короткий пересказ",
    estMinutes: 2,
    text: `Летом в деревне, у старой усадьбы, утка высиживала утят. Один за другим трескались яйца, и из них выглядывали жёлтые пушистые малыши. Последнее яйцо было самым большим, и из него вылез серый, неуклюжий птенец.

«Какой гадкий!» — закричали утки на птичьем дворе. Куры клевали его, индюк надувался и шипел, даже родные братья и сёстры сторонились его. Утёнку было так горько, что однажды он перелетел через забор и убежал куда глаза глядят.

Он жил на болоте среди диких уток, прятался от охотников, мок под осенними дождями. Как-то вечером он увидел в небе стаю прекрасных белых птиц с длинными гибкими шеями. Они улетали в тёплые края, и сердце утёнка сжалось от любви и тоски.

Зима выдалась суровой. Утёнок едва не вмёрз в лёд, и его подобрал добрый крестьянин. Но утёнок боялся детей и шума, опрокинул кувшин с молоком и снова убежал в снег.

Когда пришла весна, он расправил крылья и почувствовал, что они стали сильными. Он полетел над садом и опустился на пруд, где плавали те самые белые птицы. «Пусть лучше они заклюют меня», — подумал он и склонил голову к воде.

И увидел в воде своё отражение. Это был уже не серый, неуклюжий птенец. Это был прекрасный белый лебедь.

Лебеди окружили его и ласково гладили клювами. Дети на берегу кричали: «Новый прилетел! И он самый красивый!» А лебедь был так счастлив, что даже не загордился. Доброе сердце никогда не гордится.`
  },
  {
    id: 'ru-princessa-na-goroshine',
    lang: 'ru',
    title: "Принцесса на горошине",
    source: "по сказке Ханса Кристиана Андерсена (1805–1875), собственный короткий пересказ",
    estMinutes: 2,
    text: `Жил-был принц, и захотел он жениться на принцессе, только непременно на настоящей. Объехал он весь свет, и принцесс было много, но в каждой ему что-нибудь казалось не так. Вернулся принц домой и очень грустил.

Однажды вечером разыгралась страшная буря: гремел гром, лил дождь. Вдруг в городские ворота постучали. Старый король пошёл открывать.

За воротами стояла принцесса. Вода текла с её волос и платья, в башмачки натекло, а она говорила, что она настоящая принцесса.

«Ну, это мы проверим», — подумала старая королева. Она пошла в спальню, сняла с кровати всю постель и положила на доски одну маленькую горошину. Сверху постелила двадцать тюфяков, а на тюфяки ещё двадцать перин из гагачьего пуха.

На этой постели и уложили принцессу спать.

Утром её спросили, как ей спалось. «Ах, ужасно! — ответила принцесса. — Я всю ночь глаз не сомкнула. Под меня попало что-то твёрдое, теперь у меня всё тело в синяках!»

Тут все поняли, что это настоящая принцесса. Только настоящая принцесса могла почувствовать горошину сквозь двадцать тюфяков и двадцать перин. Принц женился на ней, а горошину отдали в музей, где она лежит и сейчас, если только её никто не взял.`
  },
  {
    id: 'ru-novoe-platye-korolya',
    lang: 'ru',
    title: "Новое платье короля",
    source: "по сказке Ханса Кристиана Андерсена (1805–1875), собственный короткий пересказ",
    estMinutes: 2,
    text: `Жил-был король, который больше всего на свете любил новые наряды. На каждый час дня у него был свой кафтан.

Однажды в город пришли два хитреца. Они назвались ткачами и сказали, что умеют ткать удивительную ткань: её не видит тот, кто глуп или не годится для своей должности.

Королю это очень понравилось. «Надену такое платье и сразу узнаю, кто у меня умный, а кто нет», — подумал он и дал ткачам много золота. Хитрецы поставили станки и делали вид, что ткут, хотя на станках ничего не было.

Король послал проверить работу старого министра. Министр смотрел во все глаза и ничего не видел. «Неужели я глуп?» — испугался он и сказал: «Чудесная ткань!» То же случилось и со всеми остальными придворными.

Наконец ткачи объявили, что платье готово, и сделали вид, что одевают короля. Король ничего не видел, но боялся в этом признаться. И вот он отправился в торжественное шествие по городу.

Люди на улицах кричали: «Какое прекрасное платье!» Никто не хотел показаться глупым.

И вдруг маленький мальчик громко сказал: «А король-то голый!»

Люди стали шептаться, а потом закричали все вместе: «Король голый!» Король понял, что они правы. Но он только выше поднял голову и дошёл до конца шествия, а камергеры несли за ним шлейф, которого не было.`
  },
  {
    id: 'ru-dyuymovochka',
    lang: 'ru',
    title: "Дюймовочка",
    source: "по сказке Ханса Кристиана Андерсена (1805–1875), собственный короткий пересказ",
    estMinutes: 2,
    text: `Одна женщина очень хотела маленькую дочку. Добрая колдунья дала ей ячменное зерно. Женщина посадила его в цветочный горшок, и вырос прекрасный цветок, похожий на тюльпан. Когда он раскрылся, в нём сидела крошечная девочка, ростом не больше дюйма. Её так и назвали: Дюймовочка.

Спала Дюймовочка в скорлупке грецкого ореха, а днём катала лодочку-лепесток по тарелке с водой и пела. Но однажды ночью в окно влезла старая жаба. «Вот славная невеста для моего сынка!» — сказала она и унесла скорлупку с девочкой на болото.

Дюймовочка горько плакала на широком листе кувшинки. Рыбки пожалели её, перегрызли стебель, и лист поплыл далеко-далеко. Всё лето девочка жила одна в лесу, пила росу и ела цветочную пыльцу.

Пришла зима. Замёрзшая Дюймовочка постучалась к полевой мыши, и та пустила её к себе. Мышь хотела выдать девочку за богатого соседа, крота в чёрной бархатной шубе. Крот не любил солнца и цветов, и Дюймовочке было очень грустно.

В подземном ходе лежала замёрзшая ласточка. Дюймовочка тайком укрыла её сеном и грела всю зиму, и весной ласточка ожила.

В тот день, когда Дюймовочку должны были отдать кроту, она вышла в последний раз посмотреть на солнце. И тут над ней пролетела её ласточка. «Садись ко мне на спину, я унесу тебя в тёплые края!» Дюймовочка так и сделала.

Ласточка принесла её в страну, где в каждом цветке жили маленькие эльфы. Их король, ростом с Дюймовочку, полюбил её, подарил ей крылья, и она стала королевой цветов.`
  },
  {
    id: 'ru-krasnaya-shapochka',
    lang: 'ru',
    title: "Красная Шапочка",
    source: "по сказке Шарля Перро (1628–1703) и братьев Гримм, собственный короткий пересказ",
    estMinutes: 2,
    text: `Жила-была девочка, и бабушка сшила ей красную шапочку. Девочке она так шла, что все стали звать её Красной Шапочкой.

Однажды мама испекла пирожков и сказала: «Отнеси бабушке пирожки и горшочек масла. Иди по дорожке и никуда не сворачивай».

В лесу Красной Шапочке встретился Волк. «Куда идёшь?» — спросил он. «К бабушке, она живёт за мельницей, в первом домике», — ответила девочка. Волк предложил ей нарвать бабушке цветов, а сам побежал коротким путём.

Он постучал в бабушкин домик, проглотил бабушку, надел её чепец и лёг в постель.

Пришла Красная Шапочка и удивилась: «Бабушка, почему у тебя такие большие уши?» «Чтобы лучше слышать тебя, деточка». «А почему такие большие глаза?» «Чтобы лучше видеть тебя». «А почему такие большие зубы?» «Чтобы съесть тебя!» И Волк проглотил Красную Шапочку.

Наелся Волк и громко захрапел. Мимо шли охотники и удивились: что это бабушка так храпит? Они вошли, увидели Волка и разрезали ему брюхо. Оттуда выскочили Красная Шапочка и бабушка, живые и невредимые.

Все вместе пили чай с пирожками. А Красная Шапочка пообещала себе больше никогда не сворачивать с дорожки и не разговаривать в лесу с незнакомцами.`
  },
  {
    id: 'ru-kot-v-sapogah',
    lang: 'ru',
    title: "Кот в сапогах",
    source: "по сказке Шарля Перро (1628–1703), собственный короткий пересказ",
    estMinutes: 2,
    text: `У мельника было три сына. Когда он умер, старшему досталась мельница, среднему осёл, а младшему только кот. «Что мне делать с котом?» — горевал младший сын.

«Не печальтесь, хозяин, — сказал вдруг Кот. — Дайте мне мешок и сапоги, и вы увидите, что я чего-то стою».

Кот натянул сапоги, поймал в мешок кролика и отнёс его королю. «Это подарок от моего господина, маркиза Карабаса», — сказал Кот. Так он носил подарки много дней, и король запомнил маркиза.

Однажды Кот узнал, что король с дочерью поедут вдоль реки. «Идите купаться, хозяин», — велел он. Когда карета поравнялась с рекой, Кот закричал: «Помогите! Маркиз Карабас тонет, а воры украли его одежду!» Король велел дать юноше лучший наряд и пригласил его в карету.

Кот бежал впереди. Косарям в полях он говорил: «Скажите королю, что эти луга принадлежат маркизу Карабасу». И косари так и говорили.

Земли на самом деле принадлежали Людоеду, который жил в замке. Кот пришёл к нему и сказал: «Говорят, вы умеете превращаться в кого угодно. Но в маленькую мышку, наверное, не сможете?» Людоед тут же стал мышью, а Кот её и поймал.

Когда подъехала карета, Кот встретил гостей у ворот: «Добро пожаловать в замок маркиза Карабаса!» Король был восхищён, принцесса полюбила юношу, и вскоре сыграли свадьбу. А Кот стал важным вельможей и ловил мышей только для развлечения.`
  },
  {
    id: 'ru-bremenskie-muzykanty',
    lang: 'ru',
    title: "Бременские музыканты",
    source: "по сказке братьев Гримм (Якоб 1785–1863, Вильгельм 1786–1859), собственный короткий пересказ",
    estMinutes: 2,
    text: `Жил у хозяина старый осёл. Много лет он носил на мельницу мешки, а когда состарился, хозяин решил от него избавиться. Осёл понял это и ушёл в город Бремен: там, думал он, можно стать уличным музыкантом.

По дороге он встретил старого пса, которого прогнали с охоты. «Идём со мной в Бремен, будем музыкантами!» Пёс согласился. Потом к ним присоединился кот, который больше не ловил мышей, и петух, которого хотели сварить в супе.

К ночи они пришли в лес и увидели свет в окошке. Это был дом, где разбойники сидели за богатым столом.

Звери придумали, как их прогнать. Осёл встал на задние ноги у окна, пёс забрался ему на спину, кот на пса, а петух на голову кота. И все разом заиграли свою музыку: осёл заревел, пёс залаял, кот замяукал, петух закукарекал. Потом они с грохотом ввалились в окно.

Разбойники решили, что к ним нагрянуло чудище, и в страхе убежали в лес. А звери поели и улеглись спать: осёл на соломе, пёс за дверью, кот у тёплой печки, петух на насесте.

Ночью один разбойник вернулся посмотреть, что там. Кот оцарапал его, пёс укусил за ногу, осёл лягнул, а петух закричал «кукареку!». Разбойник прибежал к своим и рассказал, что в доме ведьма, людоед и великан. Больше разбойники туда не возвращались.

А музыкантам так понравилось в этом домике, что до Бремена они так и не дошли и живут там до сих пор.`
  },
  {
    id: 'ru-gorshochek-kashi',
    lang: 'ru',
    title: "Горшочек каши",
    source: "по сказке братьев Гримм (Якоб 1785–1863, Вильгельм 1786–1859), собственный короткий пересказ",
    estMinutes: 1,
    text: `Жила-была бедная добрая девочка со своей мамой. Есть им было совсем нечего. Пошла девочка в лес за ягодами и встретила старушку.

Старушка знала про их нужду и подарила девочке глиняный горшочек. «Скажи ему: горшочек, вари! И он сварит вкусной сладкой каши. А скажешь: горшочек, не вари! И он перестанет».

Девочка принесла горшочек домой, и с тех пор они с мамой никогда не голодали.

Однажды девочка ушла из дому, а мама решила сварить каши. «Горшочек, вари!» — сказала она. Горшочек стал варить. Каши набралось полно, а горшочек всё варит и варит. Мама забыла, какие слова надо сказать, чтобы он остановился.

Каша полезла через край, залила кухню, потом весь дом, потом соседний дом и всю улицу. Люди не знали, что делать.

Тут вернулась девочка. Увидела она кашу и сказала: «Горшочек, не вари!» И горшочек перестал.

А тому, кто хотел вернуться в город, пришлось проедать себе дорогу через кашу.`
  },
  {
    id: 'ru-tri-medvedya',
    lang: 'ru',
    title: "Три медведя",
    source: "по сказке Льва Николаевича Толстого (1828–1910), собственный короткий пересказ",
    estMinutes: 2,
    text: `Одна девочка ушла из дома в лес. Заблудилась она и стала искать дорогу домой, да не нашла, а пришла к домику в лесу.

Дверь была открыта. Девочка заглянула и увидела, что в домике никого нет. А жили там три медведя: папа Михаил Иванович, большой и лохматый, мама Настасья Петровна, поменьше, и маленький медвежонок Мишутка. Медведи ушли гулять в лес.

В домике стоял стол, а на нём три чашки с похлёбкой: большая, средняя и маленькая. Девочка попробовала из большой, потом из средней, а из маленькой чашечки съела всё. Потом она посидела на трёх стульях и сломала маленький стульчик Мишутки.

В другой комнате стояли три кровати. Девочка легла на маленькую, она пришлась ей как раз впору, и девочка заснула.

Вернулись медведи. «Кто хлебал из моей чашки?» — заревел Михаил Иванович. «Кто хлебал из моей чашки?» — зарычала Настасья Петровна. А Мишутка запищал: «Кто хлебал из моей чашечки и всё выхлебал? Кто сидел на моём стульчике и сломал его?»

Пошли медведи в спальню. «Кто ложился в мою постель?» — заревел отец. А Мишутка подбежал к своей кроватке и закричал: «Вот она! Держи, держи!»

Девочка открыла глаза, увидела медведей и бросилась к окну. Окно было открыто, она выпрыгнула и убежала. И медведи её не догнали.`
  },
  {
    id: 'ru-chetyre-zhelaniya',
    lang: 'ru',
    title: "Четыре желания",
    source: "по рассказу Константина Дмитриевича Ушинского (1823–1871), собственный короткий пересказ",
    estMinutes: 2,
    text: `Митя накатался на санках с ледяной горы, набегался на коньках по замёрзшей речке и прибежал домой румяный и весёлый. «Как весело зимой! — сказал он отцу. — Я хотел бы, чтобы всё время была зима».

«Запиши своё желание в мою книжечку», — ответил отец. Митя записал.

Пришла весна. Митя бегал по зелёному лугу за пёстрыми бабочками, рвал первые цветы, слушал, как поют птицы. Прибежал он к отцу и сказал: «Какая прелесть весна! Я хотел бы, чтобы всё время была весна». Отец опять достал книжечку, и Митя записал и это желание.

Настало лето. Митя с отцом ходили на сенокос, купались в реке, собирали ягоды. Целый день мальчик радовался, а вечером сказал: «Вот уж веселье так веселье! Пусть бы лето никогда не кончалось». И это желание он записал в книжечку.

Пришла осень. В саду собирали яблоки и груши, румяные и сладкие. Митя был в восторге. «Осень лучше всех времён года!» — сказал он.

Тогда отец вынул свою книжечку и показал Мите, что тот хотел, чтобы всегда была зима, потом весна, потом лето.

Митя задумался и засмеялся. Он понял, что у каждого времени года есть своя радость.`
  },
  {
    id: 'en-three-little-pigs',
    lang: 'en',
    title: 'The Three Little Pigs',
    source: 'English folk tale, plot as collected by Joseph Jacobs, "English Fairy Tales" (1890)',
    estMinutes: 4,
    text: `Once there were three little pigs who left home to seek their fortune. The first pig built his house of straw, because it was the quickest. The second pig built his house of sticks, a little sturdier. The third pig worked hard and built his house of bricks.

One day a wolf came along and knocked at the first pig's door. "Little pig, little pig, let me come in," he said. "No, no, not by the hair of my chinny chin chin," said the pig. So the wolf huffed and puffed and blew the house in, and the little pig ran to his brother's house of sticks.

The wolf followed and knocked at the door of sticks. "Little pig, little pig, let me come in." "No, no, not by the hair of my chinny chin chin." So the wolf huffed and puffed and blew that house in too, and both pigs ran to their brother's house of bricks.

The wolf came to the house of bricks and knocked. "Little pig, little pig, let me come in." "No, no, not by the hair of my chinny chin chin." So the wolf huffed, and he puffed, and he puffed, and he huffed, but he could not blow the brick house in.

The wolf tried to trick the pigs into coming out — inviting them to a turnip field, an apple tree, a fair — but the clever pigs always went earlier than promised and got safely home before the wolf could catch them.

At last the wolf climbed onto the roof to come down the chimney. But the third pig had a big pot of water boiling on the fire, and took the lid off just in time. Down came the wolf, right into the pot, and that was the end of him.

And the three little pigs lived happily ever after in the house of bricks.`
  },
  {
    id: 'en-henny-penny',
    lang: 'en',
    title: 'Henny Penny',
    source: 'English folk tale, as collected by Joseph Jacobs, "English Fairy Tales" (1890)',
    estMinutes: 3,
    text: `One day Henny Penny was picking up corn in the yard when — whack! — something hit her on the head. "Goodness gracious me!" said Henny Penny. "The sky's a-going to fall. I must go and tell the king."

So she went along and met Cocky Locky. "Where are you going, Henny Penny?" "I'm going to tell the king the sky's a-falling." "May I come with you?" "Certainly," said Henny Penny, and off they went together.

Soon they met Ducky Daddles, then Goosey Poosey, then Turkey Lurkey — and each one asked the same question, and each one joined the little parade, all going to tell the king the sky was falling.

Then they met Foxy Loxy. "Where are you going?" asked Foxy Loxy, very politely. "We're going to tell the king the sky's a-falling." "Ah," said Foxy Loxy, "come this way — I know a shortcut through my den."

One by one, as they went into the dark den, Foxy Loxy snapped them up — Turkey Lurkey, Goosey Poosey, Ducky Daddles, Cocky Locky, and last of all, poor Henny Penny.

And so the king never did hear that the sky was falling — and it wasn't falling at all, of course. It had only been an acorn.`
  },
  {
    id: 'en-little-red-hen',
    lang: 'en',
    title: 'The Little Red Hen',
    source: 'traditional English and American folk tale, no known author',
    estMinutes: 3,
    text: `Once there was a little red hen who lived in a farmyard with a lazy dog, a lazy cat, and a lazy duck. One day the little red hen found some grains of wheat.

"Who will help me plant this wheat?" she asked. "Not I," said the dog. "Not I," said the cat. "Not I," said the duck. "Then I will do it myself," said the little red hen, and she did.

When the wheat had grown tall and golden, she asked, "Who will help me cut this wheat?" "Not I," said the dog. "Not I," said the cat. "Not I," said the duck. "Then I will do it myself," said the little red hen, and she did.

She asked who would help carry the wheat to the mill, and who would help bake it into bread, and every time the dog, the cat, and the duck said, "Not I" — and every time the little red hen did the work herself.

At last the bread was baked, warm and golden, and its smell filled the farmyard. "Who will help me eat this bread?" asked the little red hen. "I will!" said the dog. "I will!" said the cat. "I will!" said the duck.

"No," said the little red hen. "I planted it myself, I cut it myself, I carried it myself, and I baked it myself. Now my chicks and I will eat it ourselves." And she did, sharing it happily with her own little chicks.`
  },
  {
    id: 'en-gingerbread-man',
    lang: 'en',
    title: 'The Gingerbread Man',
    source: 'traditional American folk tale, no known author',
    estMinutes: 3,
    text: `An old woman baked a gingerbread man and set him on the windowsill to cool. But as soon as she turned around, he jumped down and ran out the door.

"Stop, stop!" cried the old woman and the old man, but the gingerbread man only laughed and called back, "Run, run, as fast as you can, you can't catch me, I'm the gingerbread man!" And he ran on down the road.

He ran past a cow, who tried to catch him. He ran past a horse, who tried to catch him too. Each time he called out his little rhyme and ran on, faster than anyone could follow.

At last he came to a wide river. On the bank sat a sly fox. "I cannot swim across," said the gingerbread man, worried at last. "Climb on my tail," said the fox, "and I will carry you across."

The gingerbread man climbed on. Partway across, the fox said, "Climb onto my back, or you'll get wet." Then, "Climb onto my nose, the water is getting deep."

When the gingerbread man had climbed all the way up onto the fox's nose, the fox tossed him into the air, opened his mouth — and snap! That was the end of the gingerbread man, who had outrun everyone except the one who never chased him at all.`
  },
  {
    id: 'en-tortoise-and-hare',
    lang: 'en',
    title: 'The Tortoise and the Hare',
    source: "Aesop's fable, ancient Greek folk tradition",
    estMinutes: 2,
    text: `A hare was once boasting about how fast he could run, and laughed at the tortoise for being so slow. "Let's have a race and see," said the tortoise quietly.

The animals agreed on a course, and off they went. The hare shot ahead so quickly that he was soon far out of sight. Feeling sure of winning, he decided to lie down under a tree and rest a while before finishing.

But the hare slept far longer than he meant to. Meanwhile the tortoise kept walking, slowly and steadily, one small step after another, never stopping and never hurrying.

When the hare woke up, he ran as fast as he could to the finish line — but the tortoise was already there, resting comfortably.

Slow and steady wins the race.`
  },
  {
    id: 'en-fox-and-crow',
    lang: 'en',
    title: 'The Fox and the Crow',
    source: "Aesop's fable, ancient Greek folk tradition",
    estMinutes: 2,
    text: `A crow was sitting on a branch with a fine piece of cheese in her beak. A fox passing below saw her and thought of a plan to get it for himself.

"Good day, beautiful crow," said the fox. "What glossy feathers you have, what a fine shape — I'm sure your voice must be just as lovely. Won't you sing for me?"

Flattered, the crow opened her beak to show off her voice — and the cheese fell straight down to the fox, who caught it neatly and gobbled it up.

"That will do," said the fox, walking away satisfied. "Next time, remember: don't trust flattery."`
  },
  {
    id: 'en-ugly-duckling',
    lang: 'en',
    title: "The Ugly Duckling",
    source: "after Hans Christian Andersen (1805–1875), our own short retelling",
    estMinutes: 3,
    text: `One summer, by an old farmhouse, a mother duck sat on her nest. One by one the eggs cracked open, and out came fluffy yellow ducklings. The last egg was the biggest of all, and out of it climbed a large, grey, clumsy bird.

"How ugly he is!" quacked the ducks in the farmyard. The hens pecked him, the turkey puffed himself up and gobbled at him, and even his brothers and sisters kept away. The poor duckling was so unhappy that one day he flew over the fence and ran away.

He lived in the marshes among the wild ducks, hid from the hunters and shivered in the autumn rain. One evening he saw a flock of beautiful white birds with long, graceful necks flying south, and his heart ached with longing.

The winter was bitter. The duckling almost froze into the ice, until a kind farmer carried him home. But the noise and the children frightened him, and he fled back into the snow.

When spring came, he spread his wings and found that they had grown strong. He flew over a garden and landed on a pond where the beautiful white birds were swimming. "Let them peck me if they like," he thought, and he bowed his head to the water.

And there, in the water, he saw his reflection. He was no longer a grey, clumsy bird. He was a beautiful white swan.

The other swans swam around him and stroked him gently with their beaks. Children on the bank cried, "There's a new one, and he's the loveliest of all!" The young swan was very happy, but not at all proud, for a good heart is never proud.`
  },
  {
    id: 'en-princess-and-pea',
    lang: 'en',
    title: "The Princess and the Pea",
    source: "after Hans Christian Andersen (1805–1875), our own short retelling",
    estMinutes: 2,
    text: `There was once a prince who wanted to marry a princess, but she had to be a real princess. He travelled all over the world to find one. There were plenty of princesses, but there always seemed to be something not quite right about them. So he came home again, feeling very sad.

One evening there was a terrible storm. Thunder crashed, rain poured down, and in the middle of it all someone knocked at the city gate. The old king went to open it.

There stood a princess. Water ran down her hair and her clothes, it ran in at the toes of her shoes and out at the heels, and she said that she was a real princess.

"Well, we'll soon find out," thought the old queen. She went into the bedroom, took all the bedding off the bed and put one small pea on the bedstead. On top of the pea she laid twenty mattresses, and on top of the mattresses twenty eiderdown quilts.

That was where the princess slept that night.

In the morning they asked her how she had slept. "Oh, terribly!" she said. "I hardly closed my eyes all night. There was something hard in my bed, and now I'm black and blue all over!"

Then they knew she was a real princess, because only a real princess could feel a pea through twenty mattresses and twenty quilts. So the prince married her, and the pea was put in a museum, where you may still see it, unless someone has taken it.`
  },
  {
    id: 'en-emperors-new-clothes',
    lang: 'en',
    title: "The Emperor's New Clothes",
    source: "after Hans Christian Andersen (1805–1875), our own short retelling",
    estMinutes: 2,
    text: `Many years ago there lived an emperor who loved new clothes more than anything else. He had a different coat for every hour of the day.

One day two tricksters came to town. They said they were weavers who could weave the most wonderful cloth, cloth that was invisible to anyone who was foolish or not fit for his job.

"If I wore clothes like that, I could tell the wise from the foolish," thought the emperor, and he gave them lots of gold. The tricksters set up their looms and pretended to weave, though there was nothing on the looms at all.

The emperor sent his old minister to see the work. The minister stared and stared but saw nothing. "Can I be foolish?" he worried, and he said aloud, "What beautiful cloth!" Every other courtier who came did exactly the same.

At last the weavers said the clothes were ready and pretended to dress the emperor. He could see nothing either, but he was afraid to say so. Then he set off in a grand procession through the town.

The people in the streets all cried, "What splendid new clothes!" Nobody wanted to seem foolish.

Then a little child said loudly, "But he hasn't got anything on!"

The people began to whisper, and soon everyone was shouting, "He hasn't got anything on!" The emperor knew they were right. But he held his head high and marched on to the end of the procession, while his chamberlains carried the train that wasn't there.`
  },
  {
    id: 'en-thumbelina',
    lang: 'en',
    title: "Thumbelina",
    source: "after Hans Christian Andersen (1805–1875), our own short retelling",
    estMinutes: 3,
    text: `A woman once wished very much for a tiny daughter. A kind old witch gave her a grain of barley. The woman planted it in a flowerpot, and it grew into a lovely flower like a tulip. When the petals opened, inside sat a tiny girl no bigger than a thumb. So she was called Thumbelina.

She slept in a polished walnut shell, and in the daytime she rowed a petal boat across a plate of water and sang. But one night an old toad crept in through the window. "She'll make a fine wife for my son!" said the toad, and she carried Thumbelina away to the marsh.

Thumbelina cried and cried on a broad water lily leaf. The little fish felt sorry for her, nibbled through the stem, and the leaf floated far away. All summer she lived alone in the woods, drinking dew and eating the sweet honey from flowers.

Then winter came. Cold and hungry, Thumbelina knocked at a field mouse's door, and the mouse let her in. The mouse wanted her to marry a rich neighbour, a mole in a black velvet coat. The mole hated sunshine and flowers, and Thumbelina was very sad.

In one of the mole's tunnels lay a swallow, frozen with cold. Thumbelina secretly covered it with hay and warmed it all winter, and in spring the swallow flew away, alive and well.

On the day she was to marry the mole, Thumbelina went out to see the sun one last time. Just then the swallow flew over her. "Climb on my back, and I'll carry you to the warm lands!" And so she did.

The swallow brought her to a country where tiny flower spirits lived inside the blossoms. Their king, just her size, loved her at once. He gave her a pair of wings, and she became the queen of the flowers.`
  },
  {
    id: 'en-bremen-musicians',
    lang: 'en',
    title: "The Bremen Town Musicians",
    source: "after the Brothers Grimm (Jacob 1785–1863, Wilhelm 1786–1859), our own short retelling",
    estMinutes: 3,
    text: `A donkey had carried sacks to the mill for many years. When he grew old, his master decided to get rid of him. The donkey understood and set off for the town of Bremen, where, he thought, he could become a street musician.

On the road he met an old dog who could no longer hunt. "Come with me to Bremen, we'll be musicians!" The dog agreed. Soon they were joined by a cat who could no longer catch mice, and a rooster who was about to be made into soup.

At nightfall they came to a forest and saw a light in a window. It was a house where robbers sat at a table full of good food.

The animals made a plan. The donkey stood up at the window, the dog climbed on his back, the cat on the dog, and the rooster on the cat's head. Then they all made their music at once: the donkey brayed, the dog barked, the cat miaowed and the rooster crowed. And they crashed in through the window.

The robbers thought a monster had come and ran off into the forest in terror. The animals ate their fill and went to sleep: the donkey on the straw, the dog behind the door, the cat by the warm stove and the rooster up on a beam.

In the night one robber crept back to see what had happened. The cat scratched him, the dog bit his leg, the donkey kicked him and the rooster cried cock-a-doodle-doo. The robber ran back and told the others the house was full of witches and giants. They never came back.

The four musicians liked their little house so much that they never went on to Bremen at all, and they live there to this day.`
  },
  {
    id: 'en-sweet-porridge',
    lang: 'en',
    title: "The Sweet Porridge",
    source: "after the Brothers Grimm (Jacob 1785–1863, Wilhelm 1786–1859), our own short retelling",
    estMinutes: 2,
    text: `There was once a poor, kind girl who lived with her mother. They had nothing left to eat. The girl went into the forest and met an old woman.

The old woman knew about their trouble and gave the girl a little clay pot. "Say to it, cook, little pot, cook! and it will cook good sweet porridge. Say, stop, little pot! and it will stop."

The girl took the pot home, and after that she and her mother were never hungry again.

One day, while the girl was out, her mother said, "Cook, little pot, cook!" The pot began to cook. Soon it was full, but it went on cooking and cooking, because the mother had forgotten the words to make it stop.

The porridge ran over the top, filled the kitchen, then the whole house, then the house next door and the whole street. Nobody knew what to do.

Then the girl came home. She saw the porridge and said, "Stop, little pot!" And the pot stopped.

And anyone who wanted to get back into town had to eat their way through the porridge.`
  },
  {
    id: 'en-little-red-riding-hood',
    lang: 'en',
    title: "Little Red Riding Hood",
    source: "after Charles Perrault (1628–1703) and the Brothers Grimm, our own short retelling",
    estMinutes: 2,
    text: `There was once a little girl whose grandmother made her a red hood. It suited her so well that everyone called her Little Red Riding Hood.

One day her mother baked some cakes and said, "Take these cakes and a little pot of butter to Grandmother. Keep to the path and don't wander off."

In the forest she met a wolf. "Where are you going?" he asked. "To my grandmother's, in the first cottage past the mill," said the girl. The wolf told her to pick some flowers for her grandmother, and he ran ahead by a shortcut.

He knocked at Grandmother's door, gobbled her up, put on her nightcap and got into her bed.

Little Red Riding Hood came in and was surprised. "Grandmother, what big ears you have!" "All the better to hear you with, my dear." "What big eyes you have!" "All the better to see you with." "What big teeth you have!" "All the better to eat you with!" And the wolf swallowed her up too.

Then he fell asleep and began to snore loudly. Some hunters passing by wondered why Grandmother was snoring so. They went in, found the wolf, and cut him open. Out jumped Little Red Riding Hood and her grandmother, safe and sound.

They all had tea and cakes together. And Little Red Riding Hood promised herself never again to leave the path or talk to strangers in the forest.`
  },
  {
    id: 'en-lion-and-mouse',
    lang: 'en',
    title: "The Lion and the Mouse",
    source: "Aesop's fable, ancient Greek folk tradition, our own short retelling",
    estMinutes: 2,
    text: `A lion lay asleep in the forest. A little mouse, running about, ran right over his nose and woke him up.

The lion caught the mouse under his great paw and opened his jaws to swallow him. "Please let me go!" squeaked the mouse. "If you do, perhaps one day I can help you."

The lion laughed at the idea that a tiny mouse could ever help a lion. But he was in a good mood, so he lifted his paw and let the mouse go.

Some days later the lion was caught in a hunter's net. He roared and struggled, but the more he struggled, the tighter the ropes held him.

The little mouse heard the roaring and came running. He began to gnaw at the ropes with his sharp little teeth, one rope after another, until the net fell apart and the lion was free.

"You laughed at me," said the mouse, "but now you see that even a little mouse can help a lion."

A kindness is never wasted, and no one is too small to help.`
  },
  {
    id: 'en-elephants-child',
    lang: 'en',
    title: "The Elephant's Child",
    source: "after Rudyard Kipling's Just So Stories (1902), our own short retelling",
    estMinutes: 2,
    text: `Long, long ago the elephant had no trunk. He had only a blackish, bulgy nose, as big as a boot, that he could wriggle from side to side but couldn't pick anything up with.

There was one little elephant, the Elephant's Child, who was full of curiosity and asked questions about everything. One day he asked a question nobody had ever asked: "What does the Crocodile have for dinner?" Everyone said "Hush!" and nobody would tell him.

So the Elephant's Child set off to find out for himself. He travelled to the great, grey-green, greasy Limpopo River, all set about with fever trees.

On the bank he met something that looked like a log. "Excuse me," he said politely, "have you seen a Crocodile?" "Come closer, and I'll whisper," said the log. The Elephant's Child bent down, and the Crocodile, for that is what it was, caught him by his little nose.

"Let go! You're hurting me!" cried the Elephant's Child. The Crocodile pulled, and the Elephant's Child pulled back, and his nose stretched longer and longer. At last the Crocodile let go with a plop, and the Elephant's Child sat down hard.

His nose was now a long trunk. He waited for it to shrink, but it never did. And soon he found how useful it was. He could pick fruit from high branches, swat flies, and spray cool water over his head on a hot day.

When he came home, all the other elephants wanted trunks just like his. And that is why every elephant you will ever see has a trunk, just like the curious Elephant's Child.`
  },
  {
    id: 'en-goldilocks',
    lang: 'en',
    title: "Goldilocks and the Three Bears",
    source: "English folk tale, first printed by Robert Southey in 1837, our own short retelling",
    estMinutes: 2,
    text: `Once upon a time three bears lived in a little house in the woods: a great big Father Bear, a middle-sized Mother Bear and a little wee Baby Bear.

One morning they made porridge for breakfast, but it was too hot, so they went for a walk while it cooled.

While they were out, a little girl called Goldilocks came to the house. The door was open, so she went in. On the table she saw three bowls of porridge. Father Bear's was too hot, Mother Bear's was too cold, but Baby Bear's was just right, and she ate it all up.

Then she tried the three chairs. Father Bear's was too hard, Mother Bear's was too soft, but Baby Bear's was just right, until she sat on it so hard that it broke.

Upstairs she found three beds. Father Bear's was too high, Mother Bear's was too low, but Baby Bear's was just right, and she fell fast asleep.

Then the bears came home. "Somebody's been eating my porridge!" growled Father Bear. "Somebody's been eating my porridge!" said Mother Bear. "Somebody's been eating my porridge, and they've eaten it all up!" cried Baby Bear. It was the same with the chairs.

They went upstairs. "Somebody's been sleeping in my bed!" said Father Bear. "Somebody's been sleeping in my bed, and here she is!" squeaked Baby Bear.

Goldilocks woke up, saw the three bears, jumped out of the window and ran all the way home. And she never went into anyone's house again without asking first.`
  }
];

// «Прочитать готовую сказку» показывает «Favola 10» — десять сказок на любом языке приложения.
// (Старые русские и английские тексты выше остаются: на них могут ссылаться уже записанные сказки.)
import { FAVOLA10, F10_LANGS, f10Id } from './favola10.js';
import { LITHUANIAN10 } from './lithuanian10.js';
export function libraryList(lang) {
  const l = F10_LANGS.includes(lang) ? lang : 'en';
  // в литовской версии — десять литовских сказок
  const set = l === 'lt' ? LITHUANIAN10 : FAVOLA10;
  return set.map(b => ({ id: f10Id(b.id, l), lang: l, title: b.titles[l] || b.titles.en, estMinutes: b.estMinutes, origin: b.origin, planId: b.id }));
}

export function libraryOne(id) {
  return LIBRARY.find(s => s.id === id) || null;
}
