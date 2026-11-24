/* 函数式告别 — 数据层
 * 故事、选项、函数与结局全部在这里。新增场景或选项只需要改数据。
 * 所有函数名保持与引擎一致；选项通过 fn 指向函数库。
 */
(function (root) {
  'use strict';

  var functions = {
    f1: {
      id: 'f1',
      name: '一次函数',
      label: '坚持 · 直线靠近',
      meaning: '坚持、直线靠近',
      tex: 'x',
      shortTex: 'x',
      expr: 'x',
      sign: 1,
      termTex: 'x',
      plain: 'x'
    },
    f2: {
      id: 'f2',
      name: '负一次',
      label: '后退 · 疏远',
      meaning: '后退、疏远',
      tex: '-x',
      shortTex: '-x',
      expr: '-x',
      sign: -1,
      termTex: 'x',
      plain: '-x'
    },
    f3: {
      id: 'f3',
      name: '指数衰减',
      label: '不再联系 · 慢慢冷下来',
      meaning: '不再联系、慢慢冷下来',
      tex: 'e^{-x}',
      shortTex: 'e^{-x}',
      expr: 'exp(-x)',
      sign: 1,
      termTex: 'e^{-x}',
      plain: 'e^(-x)'
    },
    f4: {
      id: 'f4',
      name: '正弦',
      label: '偶尔想起 · 分分合合',
      meaning: '偶尔想起、分分合合',
      tex: '\\sin x',
      shortTex: '\\sin x',
      expr: 'sin(x)',
      sign: 1,
      termTex: '\\sin x',
      plain: 'sin x'
    },
    f5: {
      id: 'f5',
      name: '反比例',
      label: '够不着 · 渐近线',
      meaning: '够不着、有渐近线',
      tex: '\\frac{1}{x}',
      shortTex: '\\frac{1}{x}',
      expr: '1/x',
      sign: 1,
      termTex: '\\frac{1}{x}',
      plain: '1/x'
    },
    f6: {
      id: 'f6',
      name: '开口向下的二次',
      label: '到过顶点后下坠',
      meaning: '到过顶点后下坠',
      tex: '-x^{2}',
      shortTex: '-x^{2}',
      expr: '-x^2',
      sign: -1,
      termTex: 'x^{2}',
      plain: '-x^2'
    },
    f7: {
      id: 'f7',
      name: '对数',
      label: '开始敏感 · 后来麻木',
      meaning: '一开始敏感、后来麻木',
      tex: '\\ln x',
      shortTex: '\\ln x',
      expr: 'log(x)',
      sign: 1,
      termTex: '\\ln x',
      plain: 'ln x'
    },
    f8: {
      id: 'f8',
      name: '指数增长',
      label: '越陷越深 · 投入加速',
      meaning: '越陷越深、投入加速',
      tex: 'e^{x}',
      shortTex: 'e^{x}',
      expr: 'exp(x)',
      sign: 1,
      termTex: 'e^{x}',
      plain: 'e^x'
    },
    f9: {
      id: 'f9',
      name: '分段函数',
      label: '从某天起 · 就再也不一样',
      meaning: '从某天起，就再也不一样',
      tex: '\\begin{cases}0, & x<5.2\\\\ 2, & x\\ge 5.2\\end{cases}',
      shortTex: '\\text{阶}',
      expr: null,
      sign: 1,
      termTex: '2\\,H(x-5.2)',
      plain: '2H(x-5.2)',
      note: 'H 为单位阶跃函数：x < 5.2 时为 0，x ≥ 5.2 时为 1；乘以 2 后，跳跃高度为 2。'
    },
    f10: {
      id: 'f10',
      name: '余弦',
      label: '总差半拍',
      meaning: '总差半拍',
      tex: '\\cos x',
      shortTex: '\\cos x',
      expr: 'cos(x)',
      sign: 1,
      termTex: '\\cos x',
      plain: 'cos x'
    },
    f11: {
      id: 'f11',
      name: '二次增长',
      label: '越走越远 · 加速远离',
      meaning: '越走越远、加速远离',
      tex: 'x^{2}',
      shortTex: 'x^{2}',
      expr: 'x^2',
      sign: 1,
      termTex: 'x^{2}',
      plain: 'x^2'
    },
    f12: {
      id: 'f12',
      name: '三次增长',
      label: '前期平缓 · 后期陡增',
      meaning: '前期平缓、后期陡然加速',
      tex: 'x^{3}',
      shortTex: 'x^{3}',
      expr: 'x^3',
      sign: 1,
      termTex: 'x^{3}',
      plain: 'x^3'
    },
    f13: {
      id: 'f13',
      name: '根式',
      label: '开头很快 · 后来趋平',
      meaning: '开头变化快、后来趋平，像被时间磨平',
      tex: '\\sqrt{x}',
      shortTex: '\\sqrt{x}',
      expr: 'sqrt(x)',
      sign: 1,
      termTex: '\\sqrt{x}',
      plain: '√x'
    },
    f14: {
      id: 'f14',
      name: '绝对值',
      label: '折了一下 · 换了方向',
      meaning: '在某个点折了一下、从此换了方向',
      tex: '\\left|x\\right|',
      shortTex: '\\left|x\\right|',
      expr: 'abs(x)',
      sign: 1,
      termTex: '\\left|x\\right|',
      plain: '|x|'
    },
    f15: {
      id: 'f15',
      name: '正切',
      label: '一步改变一切 · 难以推进',
      meaning: '一步影响一切，但永远难以主动推进',
      tex: '\\tan x',
      shortTex: '\\tan x',
      expr: 'tan(x)',
      sign: 1,
      termTex: '\\tan x',
      plain: 'tan x'
    }
  };

  var openings = [
    {
      id: 'line',
      key: 'line',
      title: '一条直线',
      en: 'LINE',
      shape: '没有起伏，也没有回头',
      copy: '有些开始没有预兆。只是两个人沿着同一条直线，多走了几步。',
      fn: 'f1'
    },
    {
      id: 'wave',
      key: 'wave',
      title: '一条起伏的线',
      en: 'WAVE',
      shape: '情绪有周期，靠近和退开也是',
      copy: '你以为那是心动，其实只是情绪在起伏。靠近和退开，都有周期。',
      fns: ['f4', 'f10']
    },
    {
      id: 'tan',
      key: 'tan',
      title: '正切',
      en: 'TANGENT',
      shape: '一个瞬间改变全部，却很难主动向前',
      copy: '有些瞬间改变了后面所有的事。可你始终没有学会，怎样主动向前一步。',
      fn: 'f15'
    },
    {
      id: 'decay',
      key: 'decay',
      title: '指数衰减',
      en: 'DECAY',
      shape: '热度一点点退去，越来越慢',
      copy: '热度不是突然没的。它每次只退一点，退到后来，你连失去都感觉不到。',
      fn: 'f3'
    },
    {
      id: 'down',
      key: 'down',
      title: '开口向下',
      en: 'PARABOLA',
      shape: '顶点之后，所有方向都是下坡',
      copy: '你们也曾到过最高的地方。后来每一段路，都是往下。',
      fn: 'f6'
    },
    {
      id: 'log',
      key: 'log',
      title: '对数',
      en: 'LOGARITHM',
      shape: '开头敏感，后来慢慢变平',
      copy: '最开始，她的一点回应都能让你记很久。后来，再大的事也只泛起一点波纹。',
      fn: 'f7'
    },
    {
      id: 'jump',
      key: 'jump',
      title: '跳跃间断',
      en: 'JUMP',
      shape: '没有过渡，只有一条被剪断的线',
      copy: '没有告别，也没有争吵。只是从某一天起，她就到了线的另一边。',
      fn: 'f9'
    },
    {
      id: 'up',
      key: 'up',
      title: '开口向上',
      en: 'PARABOLA',
      shape: '起初几乎看不出，后来距离越来越远',
      copy: '有些距离一开始几乎看不出来。等你看清时，已经隔了很远。',
      fn: 'f11'
    },
    {
      id: 'sqrt',
      key: 'sqrt',
      title: '根式',
      en: 'SQUARE ROOT',
      shape: '开头用力，后来被时间磨平',
      copy: '刚开始的时候，什么都很用力。后来时间把一切慢慢压平。',
      fn: 'f13'
    },
    {
      id: 'abs',
      key: 'abs',
      title: '绝对值',
      en: 'ABSOLUTE',
      shape: '在某个路口折了一下，从此换了方向',
      copy: '如果那天你在路口拐向另一边，后来的故事，会不会完全不同。',
      fn: 'f14'
    }
  ];

  var scenes = [
    {
      id: 's1',
      actLabel: '第一幕 · 初秋',
      when: '九月 · 认识第九天',
      title: '公园的第七张长椅',
      text: [
        '黄昏把公园照得很轻。湖面上还留着最后一点亮，你绕湖走了两圈，才看见她坐在第七张长椅上。',
        '她膝头放着一本合起的书，书签夹在很靠前的位置。你们认识九天，说过的话加起来不超过十句。'
      ],
      question: '这一次，你打算怎么走过去？',
      options: [
        { id: 's1a', label: '坐到她身边', text: '走过去坐下，陪她把黄昏坐完', fn: 'f1', op: '+', weight: 1, h: { axis: 'x', amp: 4, freq: 1, phase: 'sin' } },
        { id: 's1b', label: '沿湖走开', text: '绕过长椅，沿湖岸一个人走远', fn: 'f3', op: '−', weight: 0, h: { axis: 'x', amp: 5, freq: 1, phase: 'sin', kind: 'step' }, d: 'break' },
        { id: 's1c', label: '停在几步外', text: '停在她几步之外，等她先抬头', fn: 'f1', op: '+', weight: 0, h: { axis: 'x', amp: 2.5, freq: 5, phase: 'sin' }, d: 'wobble' }
      ]
    },
    {
      id: 's2',
      actLabel: '第一幕 · 初秋',
      when: '十月中 · 雨天',
      title: '窗边的第二杯',
      text: [
        '雨把咖啡馆的玻璃洗得很亮。你们本是进来躲雨的，坐到雨小了，谁也没有先起身。',
        '她的杯子已经空了，杯沿还留着一小圈温度。桌角压着新的一张单子，你一直没去点。'
      ],
      question: '雨快停了，你打算怎么结束这一桌？',
      options: [
        { id: 's2a', label: '先起身', text: '把自己的杯子收走，说一句“那我先走了”', fn: 'f3', op: '−', weight: 0, h: { axis: 'y', amp: 4, freq: 1, phase: 'cos', kind: 'decay' }, d: 'shrink' },
        { id: 's2b', label: '再点一杯', text: '问她要不要再来一杯热的，就聊这一句', fn: 'f13', op: '+', weight: 1, h: { axis: 'x', amp: 4, freq: 1, phase: 'sin' } },
        { id: 's2c', label: '留张字条', text: '在纸巾上写一行字，压在她的杯底', fn: 'f8', op: '+', weight: 0, h: { axis: 'y', amp: 3, freq: 1, phase: 'cos', kind: 'const' }, d: 'flatten' }
      ]
    },
    {
      id: 's3',
      actLabel: '第一幕 · 初秋',
      when: '十月末 · 末班车',
      title: '末班车之前',
      text: [
        '站台的风从隧道深处涌上来，把黄线吹得发亮。末班车还有四分钟。',
        '她站在黄线内，耳机只戴了一边，另一边垂在肩上，像在等谁先开口。'
      ],
      question: '车门打开之前，你会走过去吗？',
      options: [
        { id: 's3a', label: '走到她身边', text: '走到她身边，和她一起等这趟末班车', fn: 'f1', op: '+', weight: 1, h: { axis: 'x', amp: 4, freq: 1, phase: 'sin' } },
        { id: 's3b', label: '换一节车厢', text: '车来时转身，上了另一节车厢', fn: 'f2', op: '−', weight: 0, h: { axis: 'x', amp: 3, freq: 1, phase: 'sin', kind: 'ramp' }, d: 'drift' },
        { id: 's3c', label: '问她坐到哪', text: '隔着人群问她，这趟车坐到哪里', fn: 'f7', op: '÷', weight: 0, h: { axis: 'y', amp: 2.5, freq: 6, phase: 'cos' }, d: 'wobble' }
      ]
    },
    {
      id: 's4',
      actLabel: '第二幕 · 隆冬',
      when: '十二月 · 海边',
      title: '退潮以后',
      text: [
        '潮水退得很远，堤岸上只剩风声。她把鞋提在手里，赤脚走在前面，一步一个浅印。',
        '她回头看了你一眼，没有等，也没有催。这个距离，你快几步就能跟上。'
      ],
      question: '她走在前面，你跟不跟？',
      options: [
        { id: 's4a', label: '跟上去', text: '快几步跟上，和她并肩走到灯塔下', fn: 'f1', op: '+', weight: 1, h: { axis: 'x', amp: -2, freq: 3, phase: 'sin' } },
        { id: 's4b', label: '留在原地', text: '留在堤岸上，看她一点点走远', fn: 'f3', op: '−', weight: 0, h: { axis: 'y', amp: -6, freq: 1, phase: 'cos', kind: 'ramp' }, d: 'sink' },
        { id: 's4c', label: '喊她回头', text: '大声喊她，让整片海都听见', fn: 'f6', op: '÷', weight: 0, h: { axis: 'y', amp: 5, freq: 1, phase: 'cos', kind: 'ramp' }, d: 'open' }
      ]
    },
    {
      id: 's5',
      actLabel: '第二幕 · 隆冬',
      when: '一月 · 凌晨两点',
      title: '台灯亮到很晚',
      text: [
        '夜里两点，台灯还亮着。她的头像在对话框顶端亮着，绿点也在。',
        '输入框里有一句话，你删了又写，写了又删。指腹停在发送键上，已经停了很久。'
      ],
      question: '天亮之前，这句话你发不发？',
      options: [
        { id: 's5a', label: '发出去', text: '发一句“还没睡吗”，然后把手机扣在桌上', fn: 'f1', op: '+', weight: 1, h: { axis: 'x', amp: -2, freq: 3, phase: 'sin' } },
        { id: 's5b', label: '关掉屏幕', text: '关掉屏幕，把这句话留在草稿里', fn: 'f3', op: '−', weight: 0, h: { axis: 'y', amp: 4, freq: 1, phase: 'cos', kind: 'decay' }, d: 'shrink' },
        { id: 's5c', label: '一直改写', text: '一遍遍改写，直到窗外天亮', fn: 'f12', op: '÷', weight: 0, h: { axis: 'x', amp: 6, freq: 1, phase: 'sin', kind: 'step' }, d: 'break' }
      ]
    },
    {
      id: 's9',
      actLabel: '第二幕 · 隆冬',
      when: '二月 · 下雪',
      title: '长椅上的雪',
      text: [
        '雪把公园铺成一片白。你远远看见第七张长椅上坐着一个人，围巾裹到下巴，像在等人。',
        '走近才发现是她。她拍了拍身边的雪，说这儿比宿舍暖和。'
      ],
      question: '你要不要坐下？',
      options: [
        { id: 's9a', label: '坐下', text: '拂掉长椅上的雪，坐下来陪她看雪', fn: 'f7', op: '+', weight: 1, h: { axis: 'y', amp: 5, freq: 1, phase: 'cos' } },
        { id: 's9b', label: '站着说话', text: '站在长椅边，说几句就借口天冷离开', fn: 'f3', op: '−', weight: 0, h: { axis: 'y', amp: 4, freq: 1, phase: 'cos', kind: 'decay' }, d: 'shrink' },
        { id: 's9c', label: '让她别坐这', text: '说雪天太冷，拉她去旁边的便利店', fn: 'f10', op: '+', weight: 0, h: { axis: 'y', amp: 5, freq: 1, phase: 'cos', kind: 'ramp' }, d: 'open' }
      ]
    },
    {
      id: 's6',
      actLabel: '第三幕 · 第二年春',
      when: '三月 · 雨',
      title: '岔路口的红灯',
      text: [
        '雨下得不大，红灯把路口照成一片湿的橙色。你们已经在这里站了半分钟，谁都没有动。',
        '她忽然说“我有话想说”，随即又笑了一下，说算了。红灯还剩二十秒。'
      ],
      question: '这二十秒里，你问不问？',
      options: [
        { id: 's6a', label: '问到底', text: '直接问她：“我们到底算什么？”', fn: 'f7', op: '+', weight: 1, key: true, h: { axis: 'y', amp: -2.5, freq: 2, phase: 'cos' } },
        { id: 's6b', label: '什么都别问', text: '什么都不问，只陪她等完这个红灯', fn: 'f10', op: '−', weight: 0, h: { axis: 'y', amp: 3, freq: 1, phase: 'cos', kind: 'const' }, d: 'flatten' },
        { id: 's6c', label: '也笑一下', text: '也笑一下，说“那就算了”', fn: 'f6', op: '÷', weight: 0, h: { axis: 'y', amp: -6, freq: 1, phase: 'cos', kind: 'ramp' }, d: 'sink' }
      ]
    },
    {
      id: 's10',
      actLabel: '第三幕 · 第二年春',
      when: '四月 · 打烊前',
      title: '打烊前的咖啡馆',
      text: [
        '咖啡馆快打烊了，店员开始收椅子。她迟到四十分钟，坐下第一句是“对不起，路上有点堵”。',
        '你知道她住的地方离这儿只要十分钟。窗外的路灯一盏一盏灭下去。'
      ],
      question: '这句道歉，你接不接？',
      options: [
        { id: 's10a', label: '接住', text: '说没关系，把热的那杯推到她面前', fn: 'f1', op: '+', weight: 1, h: { axis: 'y', amp: 4, freq: 1, phase: 'cos' } },
        { id: 's10b', label: '点破', text: '说“你其实不用来”，然后站起来', fn: 'f6', op: '÷', weight: 0, h: { axis: 'y', amp: -6, freq: 1, phase: 'cos', kind: 'ramp' }, d: 'sink' },
        { id: 's10c', label: '不提', text: '什么都不提，照常问她想喝什么', fn: 'f3', op: '−', weight: 0, h: { axis: 'x', amp: 0.6, freq: 5, phase: 'sin' }, d: 'void' }
      ]
    },
    {
      id: 's11',
      actLabel: '第三幕 · 第二年春',
      when: '五月 · 夜里',
      title: '天台的电话',
      text: [
        '凌晨一点，她打来电话，第一句是“我在楼下”。你住在七楼，天台的门没锁。',
        '她站在栏杆边，头发被风吹得很乱，说的是“我可能要去别的城市”。'
      ],
      question: '你要不要把话说清楚？',
      options: [
        { id: 's11a', label: '说清楚', text: '告诉她你不想她走，把话说到底', fn: 'f13', op: '+', weight: 1, key: true, h: { axis: 'y', amp: 4, freq: 1, phase: 'cos' } },
        { id: 's11b', label: '祝她顺利', text: '说那挺好的，祝你顺利', fn: 'f3', op: '−', weight: 0, h: { axis: 'y', amp: 0.6, freq: 6, phase: 'cos' }, d: 'void' },
        { id: 's11c', label: '什么也不说', text: '什么都不说，陪她站到天亮', fn: 'f10', op: '÷', weight: 0, h: { axis: 'y', amp: 3, freq: 1, phase: 'cos', kind: 'const' }, d: 'flatten' }
      ]
    },
    {
      id: 's7',
      actLabel: '第四幕 · 那年夏天',
      when: '七月 · 她走的那天',
      title: '站台之外',
      text: [
        '她走的那天，广播一遍遍报着车次。你站在车站外，隔着玻璃看见她拖着箱子往里走。',
        '手机在口袋里震了一下。还有十分钟，检票口就要关了。'
      ],
      question: '这十分钟，你往哪边走？',
      options: [
        { id: 's7a', label: '走进站台', text: '走进站台，叫住她，把没说的话说完', fn: 'f1', op: '+', weight: 1, key: true, h: { axis: 'y', amp: -2.5, freq: 2, phase: 'cos' } },
        { id: 's7b', label: '转身离开', text: '没有进去，照常去上那节课', fn: 'f3', op: '−', weight: 0, h: { axis: 'y', amp: 4, freq: 1, phase: 'cos', kind: 'decay' }, d: 'shrink' },
        { id: 's7c', label: '追着车跑', text: '等车开走，追着车窗跑了一段', fn: 'f6', op: '÷', weight: 0, h: { axis: 'x', amp: 3, freq: 1, phase: 'sin', kind: 'ramp' }, d: 'drift' }
      ]
    },
    {
      id: 's12',
      actLabel: '第四幕 · 那年夏天',
      when: '八月 · 走廊',
      title: '搬家那天的雨',
      text: [
        '她走后一个月，你回去收拾那间合租的屋子。走廊灯坏了一半，纸箱堆在门口。',
        '她的钥匙还在鞋柜上，压着一张没写完的便签。雨从楼道口斜进来，把纸角打湿。'
      ],
      question: '那把钥匙，你怎么办？',
      options: [
        { id: 's12a', label: '寄还给她', text: '把钥匙和便签一起寄到她新地址', fn: 'f1', op: '+', weight: 1, h: { axis: 'y', amp: -2, freq: 3, phase: 'cos' } },
        { id: 's12b', label: '留在原地', text: '把钥匙放回鞋柜，当作没人住过', fn: 'f9', op: '−', weight: 0, h: { axis: 'x', amp: 5, freq: 1, phase: 'sin', kind: 'step' }, d: 'break' },
        { id: 's12c', label: '扔进垃圾桶', text: '连同便签一起，扔进楼下的垃圾桶', fn: 'f5', op: '÷', weight: 0, h: { axis: 'x', amp: 3, freq: 1, phase: 'sin', kind: 'ramp' }, d: 'drift' }
      ]
    },
    {
      id: 's8',
      actLabel: '尾声 · 两年后',
      when: '九月 · 两年后',
      title: '天台的月亮',
      text: [
        '两年后的九月，你因为出差路过那座城市。会开得早，你一个人上了旧楼的天台。',
        '月亮很亮，楼下的路灯一盏盏亮起来。手机里那个名字，删过一次，又加回来过。'
      ],
      question: '下楼之前，你要不要留下点什么？',
      options: [
        { id: 's8a', label: '发一句好久不见', text: '给她发一句“好久不见”，然后等回音', fn: 'f14', op: '+', weight: 1, h: { axis: 'y', amp: -1, freq: 4, phase: 'cos' } },
        { id: 's8b', label: '删掉名字', text: '把她的名字从通讯录里删掉', fn: 'f3', op: '−', weight: 0, h: { axis: 'y', amp: 3, freq: 1, phase: 'cos', kind: 'const' }, d: 'flatten' },
        { id: 's8c', label: '写进日记', text: '把这一段写进日记，然后继续生活', fn: 'f7', op: '×', weight: 0, h: { axis: 'x', amp: 2.5, freq: 5, phase: 'sin' }, d: 'wobble' }
      ]
    },
    {
      id: 's13',
      slot: 2,
      actLabel: '第一幕 · 初秋',
      when: '十一月初 · 还书',
      title: '还书那天',
      text: [
        '她发消息说书看完了，问你要不要拿回去。你说好，约在公园门口。',
        '她比约定时间早到，站在第七张长椅旁边，手里拎着一个纸袋。风把她的头发吹到脸上。'
      ],
      question: '这一次，你打算怎么把书接过来？',
      options: [
        { id: 's13a', label: '在长椅上坐下', text: '接过书，坐下和她把下午聊完', sincere: true },
        { id: 's13b', label: '在路灯下翻书', text: '站在原地翻开那本书，问她最喜欢哪一页' },
        { id: 's13c', label: '把书挂在树上', text: '把书挂到树枝上，说这样下次好找' }
      ]
    },
    {
      id: 's14',
      slot: 3,
      actLabel: '第二幕 · 隆冬',
      when: '十二月 · 末班车后',
      title: '末班车之后',
      text: [
        '她加班到很晚。你在站台的便利店等她，玻璃上全是关东煮的热气。',
        '她进来时手指冻得发红，坐下第一句是“你怎么还没走”。'
      ],
      question: '这半个小时，你打算怎么过？',
      options: [
        { id: 's14a', label: '在长椅上等', text: '把靠里的位置让给她，等她先开口', sincere: true },
        { id: 's14b', label: '盯着站台的钟', text: '一直看时间，提醒她末班车快到了' },
        { id: 's14c', label: '走到出口', text: '说太晚了，先送她回去' }
      ]
    },
    {
      id: 's15',
      slot: 5,
      actLabel: '第二幕 · 隆冬',
      when: '十二月三十一 · 夜',
      title: '天台上的烟花',
      text: [
        '除夕夜她问你有没有地方去。你说没有，她说那上天台吧。',
        '零点前，远处的烟花一朵一朵炸开，她把围巾分给你一半。'
      ],
      question: '烟花响的时候，你想说什么？',
      options: [
        { id: 's15a', label: '靠在栏杆边', text: '说想和她一起过下一个年', sincere: true },
        { id: 's15b', label: '把那本书递给她', text: '把一直没还的书递给她，说新年快乐' },
        { id: 's15c', label: '一起看月亮', text: '什么都不说，只看远处的烟花' }
      ]
    },
    {
      id: 's16',
      slot: 5,
      actLabel: '第二幕 · 隆冬',
      when: '一月 · 她生日',
      title: '她的生日',
      text: [
        '她生日那天，你们约在打烊前的咖啡馆。你提着蛋糕，等了很久。',
        '她来的时候妆有点花，说临时加班，坐下后一直在看手机。'
      ],
      question: '这块蛋糕，你还切不切？',
      options: [
        { id: 's16a', label: '把蛋糕放在杯边', text: '把蛋糕推到她面前，说生日快乐', sincere: true },
        { id: 's16b', label: '写一张便签', text: '在便签上写一句话，压在她的杯底' },
        { id: 's16c', label: '替她拉开椅子', text: '什么都不问，替她拉开椅子' }
      ]
    },
    {
      id: 's17',
      slot: 7,
      actLabel: '第三幕 · 第二年春',
      when: '四月 · 旧书摊',
      title: '旧书摊',
      text: [
        '春天去公园，你在旧书摊上看见她提过的那本书。',
        '摊主说十块。你翻到扉页，上面有她以前的字。'
      ],
      question: '这本书，你买不买？',
      options: [
        { id: 's17a', label: '坐在长椅上翻', text: '买下来，坐在长椅上翻完一章', sincere: true },
        { id: 's17b', label: '在路灯下看扉页', text: '拍下扉页发给她，问她还要不要' },
        { id: 's17c', label: '把书放回树下', text: '把书放回摊上，转身走了' }
      ]
    },
    {
      id: 's18',
      slot: 11,
      actLabel: '第四幕 · 那年夏天',
      when: '八月 · 她走后一个月',
      title: '一个人的房间',
      text: [
        '她走后一个月，你回那间合租的屋子收拾东西。',
        '衣柜里还留着一件她的外套，桌角压着没写完的便签。'
      ],
      question: '这些东西，你怎么处理？',
      options: [
        { id: 's18a', label: '拿起手机', text: '把她的东西收进纸箱，发消息问她新地址', sincere: true },
        { id: 's18b', label: '坐在椅子上', text: '在原处坐一会儿，什么都不动' },
        { id: 's18c', label: '关掉台灯', text: '关灯离开，把钥匙留在鞋柜上' }
      ]
    }
  ];

  // 序章：进入第一题之前交代"她是谁、你们怎么认识的"。
  // 只出现一次、不计分，不写入 state.funcs，因此不影响 F(x) 与结局判定。
  var prologue = {
    id: 'p0',
    actLabel: '序章',
    kicker: 'PROLOGUE',
    title: '那年初秋',
    art: 's1',
    text: [
      '你们是在公园认识的。那年初秋，你每天傍晚绕着湖走两圈，她总坐在第七张长椅上，看一本一直没看完的书。',
      '第一句话是你先说的——问她借一支笔。后来是同一家便利店、同一条回宿舍的路、很多次把天聊到很晚。没有人先说要在一起，也没有人先走开。',
      '再后来是毕业、换城市、联系慢慢变少。接下来的三十次选择散落在这些年里，每一次都小到当时你不会记得；可它们会一个一个加起来，成为你们之间那条曲线。'
    ]
  };

  var endings = {
    good: {
      kind: 'good',
      order: 0,
      title: '同行',
      en: 'TOGETHER',
      shape: '完整的心 · 十二项谐波恰好合上',
      text: '十二个选择各自只是一道很小的波，单看都不起眼。可当它们一项一项叠在一起，就变成了一颗完整的心。不是某一个瞬间拯救了什么，而是每一次你都没有把那一项换掉。你们还是会吵架，还是会在深夜沉默，可这些壁壁不再是结局的前奏。图形之所以完整，不是因为它许诺了永远，而是因为每一次都真的没有少一项。，是打烊前把热的那杯推过去，是检票口前叫住她的那一声，是十一次明知可能被拒绝、仍然把真话说出口的选择。她后来常说，不是那句话救了她，是你在那么多可以退开的时刻都没有退开。你们还是会吵架，还是会在深夜沉默，可沉默不再是结局的前奏。曲线一路上升，不因为它许诺了永远，而是因为每一次都真的往下走了一点。',
      principle: '真心不是一次表白，是很多次都没有走开。',
      lead: '这一次，它合上了。',
      good: true
    },
    jump: {
      kind: 'jump',
      order: 1,
      title: '断开',
      en: 'JUMP',
      shape: '突然断开 · 两步之间没有过渡',
      text: '你们并不是一点点走远的。有些日子还好好的，甚至比之前更近。然后是一句“算了”，一次没回的消息，一个岔路口的红灯之后的沉默——两个人对同一件事的理解，忽然落到了两边。你后来反复回想那个下午，想找出是哪一句话把线剪断的，可真正的断开往往没有声音。断点不证明之前的相处是假的，也不意味着只差一句挽留就能接上。它只是标记了：从那里起，你们不再用同一种方式理解彼此。',
      principle: '有些变化不是逐渐发生的；某个时刻之后，原来的相处方式便难以为继。',
      lead: '曲线在这里断成了两段。'
    },
    asymptote: {
      kind: 'asymptote',
      order: 2,
      title: '够不到',
      en: 'ASYMPTOTE',
      shape: '无限靠近 · 却始终差一点',
      text: '你一直在靠近。约她出来、记得她说过的话、把想说的在心里排练很多遍。可她始终在那条线的另一侧——不是拒绝，也不是接受，永远差一点确认。你后来明白，靠近这件事需要两个人用同一种方式靠近；一个人使劲，只会让距离变得像有形状。那不算失败，只是你们没形成同一种靠近。承认这一点，比继续使劲要难。',
      principle: '主动能缩短距离，却不能替另一个人决定靠近。',
      lead: '曲线无限接近那条线，却不相交。'
    },
    decay: {
      kind: 'decay',
      order: 3,
      title: '变冷',
      en: 'DECAY',
      shape: '一路变轻 · 越来越接近平静',
      text: '消息从每天变成每周，再变成节日里的一句问候。没有人做错什么，只是生活把两个人带向不同的重心。你没有删她，她也没有删你；对话框还留着，只是越来越短。热度不是突然不见的，它每次只退一点，退到后来你连失去都说不出具体的日期。这条曲线最后落在很低的地方，但不是零——它更像记忆终于停在一个不再打扰你的位置。',
      principle: '联系少了，回应常常会变轻；但淡去不是归零。',
      lead: '曲线一路向下，慢慢变平。'
    },
    sine: {
      kind: 'sine',
      order: 4,
      title: '忽远忽近',
      en: 'SINE',
      shape: '反复起伏 · 靠近与退开轮流出现',
      text: '她偶尔回你一句很热的话，你就以为一切还能继续；下一次消息石沉大海，你又回到原点。关系没有固定的周期，反复的其实是你的期待：把偶尔的回应读成希望，把沉默读成考验。你删过聊天记录，也把照片移进隐藏相册，可一条相似的路、一首旧歌，又能让想念涨起来。真正困住你的也许不是她，是同一个解释被反复使用。',
      principle: '反复的常常是期待，而不是关系本身。',
      lead: '曲线在同一个高度反复起伏。'
    },
    parabola: {
      kind: 'parabola',
      order: 5,
      title: '下坡',
      en: 'PARABOLA',
      shape: '先升后落 · 顶点之后一路向下',
      text: '你们确实到过最高的地方。那时你说什么她都笑，你觉得只要再用力一点，两个人就能被托住。可过了那个顶点，继续加码换来的不是更近，而是压力、错位、更快的退开。付出和回应不总是同向增长，这条曲线只是把这件事画了出来。顶点不是判决，它只是提醒：关系的条件变了。你后来学会允许一段真心有峰值，也允许它不必靠更多付出来证明自己有价值。',
      principle: '越过某个阶段，继续加码未必能让两个人更靠近。',
      lead: '曲线有一个顶点，然后开始下坡。'
    },
    log: {
      kind: 'log',
      order: 6,
      title: '慢慢变平',
      en: 'LOGARITHM',
      shape: '仍在上行 · 但每次都涨得更少',
      text: '后来你不再打扰她，也没有停下生活：写日记、搬家、认识新的人，学着照顾自己。起初一点小事都能让你难受很久；再后来，你还是会想起，只是那种想起不再剧烈。这条曲线一直在往上，但每一次的涨幅都比上一次小。它不是痊愈的证明，也不保证一年比一年更好，只是把变化画出来：她不再是可能的人，慢慢成了你理解自己的一个部分。',
      principle: '有些理解会随时间增加，却越来越轻。',
      lead: '曲线还在上升，只是越来越缓。'
    },
    flat: {
      kind: 'flat',
      order: 7,
      title: '归零',
      en: 'FLAT',
      shape: '几乎没有变化 · 什么都没有积累',
      text: '每一次你都选了更安全的那一边：不冒犯、不追问、不靠近。于是什么也没有发生——不是失败，也不是误会，只是没有任何一句话被真正说出口。她大概也感觉到了，所以连试探都省了。这条几乎是平的曲线，是十二次选择叠加出来的一条直线：每一次都少一点点，加起来就什么都没有。你偶尔会想，如果某一次多走半步，会不会不一样；但数学很诚实，没有发生的事，不计入。',
      principle: '一直退让不会伤害谁，但它也不会让任何东西发生。',
      lead: '曲线几乎是平的——什么都没有积累起来。'
    },
    drift: {
      kind: 'drift',
      order: 8,
      title: '越走越远',
      en: 'DRIFT',
      shape: '持续偏离 · 距离一路拉大',
      text: '一开始几乎看不出来。你只是没有再去那条长椅，她只是没有再问你在不在。日子照常过，可两个人之间那条缝在慢慢变宽——不是谁推开的，是各自往不同的方向走，而中间没有人回过头。这条曲线一路上升，看起来像在增长；可惜它量的是距离。等你看清的时候，已经隔了很远，连一句“最近怎么样”都显得唐突。',
      principle: '有些疏远不必有原因，只需要方向不同。',
      lead: '曲线一直在涨——涨的是距离。'
    }
  };

  var interludes = [
    {
      id: 'n1',
      actLabel: '第一幕 · 初秋',
      kicker: '间章',
      title: '走回家的路',
      text: [
        '公园关门前的铃声响了一遍。你回头看了一眼第七张长椅，走到路口才发现自己绕了远路。',
        '路灯一盏一盏亮起来，像有人在替你数着还没说出口的话。'
      ],
      art: 's1'
    },
    {
      id: 'n2',
      actLabel: '第二幕 · 隆冬',
      kicker: '间章',
      title: '车厢的最后一排',
      text: [
        '末班车开得很稳。车窗上映出她的侧脸，和车厢里一排排暗下去的灯。',
        '广播报出一个又一个站名。你数着，数到她要下的那一站，才发现自己一直没有起身。'
      ],
      art: 's3'
    },
    {
      id: 'n3',
      actLabel: '第二幕 · 隆冬',
      kicker: '间章',
      title: '风从海上来',
      text: [
        '从地铁口出来，风里有咸味。你忽然想起她说过的海，和她把鞋提在手里的样子。',
        '你在台阶上站了一会儿，直到风把衣角吹凉，才慢慢往家走。'
      ],
      art: 's4'
    },
    {
      id: 'n4',
      actLabel: '第三幕 · 第二年春',
      kicker: '间章',
      title: '天亮之前',
      text: [
        '你打了“我没有多想”，又一个字一个字删掉。房间安静得能听见电流声。',
        '窗帘缝里慢慢亮起来。楼下第一班车开过时，你终于闭上眼睛。'
      ],
      art: 's5'
    },
    {
      id: 'n5',
      actLabel: '第三幕 · 第二年春',
      kicker: '间章',
      title: '没有发出去的那句',
      text: [
        '回到家，你把湿透的伞撑在门口。手机屏幕亮了又灭。',
        '你打了一行字，又一个字一个字删掉。窗外的红灯还停在同一个位置。'
      ],
      art: 's6'
    },
    {
      id: 'n6',
      actLabel: '尾声 · 两年后',
      kicker: '间章',
      title: '回来的路',
      text: [
        '离开车站时，天已经黑透了。你沿着来时的路往回走，路灯把影子拉得很长。',
        '你没有回头。广播声在身后越来越远，像替你把那句话说完了。'
      ],
      art: 's7'
    }
  ];

  var chats = [
    {
      id: 'c1',
      actLabel: '间章 · 消息',
      contact: '见微',
      time: '23:47',
      day: '十一月 · 夜',
      title: '夜里十一点四十七',
      messages: [
        '今天，谢谢。',
        '雨停得比想象中早。'
      ],
      replies: [
        {
          text: '下次换我请你。',
          after: ['看时间吧。', '这周好像都很满。']
        },
        {
          text: '你到家了吗？',
          after: ['到了。', '刚洗完澡。']
        },
        {
          text: '那本书，下次借我。',
          after: ['你还记得啊。', '书在我这儿，一直没还回去。']
        }
      ],
      second: {
        messages: [
          '其实今天我本来想问你一件事。',
          '还是算了，改天吧。'
        ],
        replies: [
          {
            text: '现在问吧，我在。',
            after: ['算了，说出来就变味了。', '改天吧，真的。']
          },
          {
            text: '那你早点睡。',
            after: ['嗯。', '你也早点。']
          },
          {
            text: '好，那改天。',
            after: ['嗯，改天。', '别等太久。']
          }
        ]
      }
    },
    {
      id: 'c2',
      actLabel: '间章 · 消息',
      contact: '见微',
      time: '01:12',
      day: '两周后 · 凌晨',
      title: '正在输入',
      messages: [
        '最近有点忙，等安顿好再聊。',
        '不是你的问题。'
      ],
      replies: [
        {
          text: '好，你先忙。',
          after: ['嗯，谢谢你理解。', '等我这边定下来。']
        },
        {
          text: '我等你。',
          after: ['别等了。', '我不确定要多久。']
        },
        {
          text: '是不是发生什么了？',
          after: ['没什么大事。', '就是有点累。']
        }
      ],
      second: {
        messages: [
          '你睡了吗？',
          '我这边已经三点了。'
        ],
        replies: [
          {
            text: '还没，怎么了？',
            after: ['没什么，就是突然想说说话。', '你别多想。']
          },
          {
            text: '快睡吧。',
            after: ['好。', '晚安。']
          },
          {
            text: '三点了还不睡？',
            after: ['睡不着。', '房间太安静了。']
          }
        ]
      }
    },
    {
      id: 'c3',
      actLabel: '间章 · 消息',
      contact: '见微',
      time: '21:05',
      day: '她走的那天 · 夜里',
      title: '已到达',
      messages: [
        '我到了。',
        '这里的风比这边大。'
      ],
      replies: [
        {
          text: '一路顺利。',
          after: ['嗯，车上睡了一路。', '下车的时候天已经黑了。']
        },
        {
          text: '照顾好自己。',
          after: ['你也是。', '记得按时吃饭。']
        },
        {
          text: '我本来想去送你。',
          after: ['我知道。', '所以才没告诉你车次。']
        }
      ],
      second: {
        messages: [
          '车快到站了。',
          '我把那本书带走了。'
        ],
        replies: [
          {
            text: '书你不用还。',
            after: ['我知道。', '可我还是想留着。']
          },
          {
            text: '到了说一声。',
            after: ['嗯。', '这趟车很慢。']
          },
          {
            text: '一路顺风。',
            after: ['谢谢。', '你也是。']
          }
        ]
      }
    },
    {
      id: 'c4',
      actLabel: '间章 · 消息',
      contact: '见微',
      time: '02:04',
      day: '二月 · 凌晨',
      title: '雪还在下',
      messages: [
        '外面下雪了。',
        '你那边看得见吗？'
      ],
      replies: [
        {
          text: '看见了，很大。',
          after: ['我拍了照片。', '等下传给你。']
        },
        {
          text: '我这边没雪。',
          after: ['那我们不一样。', '有点可惜。']
        },
        {
          text: '你怎么还没睡？',
          after: ['睡不着。', '就想找个人说说话。']
        }
      ],
      second: {
        messages: [
          '照片拍糊了。',
          '手太冷。'
        ],
        replies: [
          {
            text: '糊的也看。',
            after: ['那我发了。', '别嫌丑。']
          },
          {
            text: '那你回屋里。',
            after: ['再站一会儿。', '雪很好看。']
          },
          {
            text: '明天再拍。',
            after: ['明天雪就化了。', '……好吧。']
          }
        ]
      }
    },
    {
      id: 'c5',
      actLabel: '间章 · 消息',
      contact: '见微',
      time: '21:40',
      day: '九月 · 她走后一个月',
      title: '新的地址',
      messages: [
        '我找到房子了。',
        '窗户朝南。'
      ],
      replies: [
        {
          text: '那就好。',
          after: ['嗯。', '比原来那间大一点。']
        },
        {
          text: '需要帮忙吗？',
          after: ['不用，都收拾好了。', '谢谢你。']
        },
        {
          text: '地址发我。',
          after: ['发你干嘛。', '……好吧，发你。']
        }
      ],
      second: {
        messages: [
          '其实这里挺安静的。',
          '晚上什么声音都没有。'
        ],
        replies: [
          {
            text: '安静也好。',
            after: ['嗯。', '就是有点不习惯。']
          },
          {
            text: '要不要我打电话？',
            after: ['现在？', '……可以。']
          },
          {
            text: '早点适应。',
            after: ['嗯。', '我试试。']
          }
        ]
      }
    }
  ];

  var beats = [
    { type: 'scene', slot: 1, default: 's1', id: 's1' },
    { type: 'interlude', id: 'n1' },
    { type: 'scene', slot: 2, default: 's2', id: 's2' },
    { type: 'chat', id: 'c1' },
    { type: 'scene', slot: 3, default: 's9', id: 's9' },
    { type: 'interlude', id: 'n2' },
    { type: 'scene', slot: 4, default: 's4', id: 's4' },
    { type: 'interlude', id: 'n3' },
    { type: 'chat', id: 'c2' },
    { type: 'scene', slot: 5, default: 's15', id: 's15' },
    { type: 'chat', id: 'c4' },
    { type: 'scene', slot: 6, default: 's6', id: 's6' },
    { type: 'interlude', id: 'n5' },
    { type: 'scene', slot: 7, default: 's10', id: 's10' },
    { type: 'interlude', id: 'n4' },
    { type: 'scene', slot: 8, default: 's11', id: 's11' },
    { type: 'scene', slot: 9, default: 's7', id: 's7' },
    { type: 'interlude', id: 'n6' },
    { type: 'chat', id: 'c3' },
    { type: 'scene', slot: 10, default: 's12', id: 's12' },
    { type: 'chat', id: 'c5' },
    { type: 'scene', slot: 11, default: 's18', id: 's18' },
    { type: 'scene', slot: 12, default: 's8', id: 's8' }
  ];

  /* ---------------- 分支剧情：12 个槽位 / 18 个场景 ----------------
   * 每个槽位有一次计分选择；同一槽位的不同场景共享该槽的谐波与选项语义，
   * 因此无论走到哪条分支，12 次真诚选择都仍然精确加出心形。
   * 选项的 next 决定下一景；聊天回复可以覆盖 next；bridge 是下一节点开头的承接句。
   */
  var slotScenes = [
    ['s1'],
    ['s2', 's3', 's13'],
    ['s9', 's14'],
    ['s4', 's5'],
    ['s15', 's16'],
    ['s6'],
    ['s10', 's17'],
    ['s11'],
    ['s7'],
    ['s12'],
    ['s18'],
    ['s8']
  ];

  var slotMath = [
    { h: { axis: 'x', amp: 4, freq: 1, phase: 'sin' }, fns: ['f1', 'f3', 'f1'],
      bad: [
        { d: 'break', h: { axis: 'x', amp: 5, freq: 1, phase: 'sin', kind: 'step' }, fn: 'f3' },
        { d: 'wobble', h: { axis: 'x', amp: 2.5, freq: 5, phase: 'sin' }, fn: 'f1' }
      ] },
    { h: { axis: 'x', amp: 4, freq: 1, phase: 'sin' }, fns: ['f3', 'f13', 'f8'],
      bad: [
        { d: 'shrink', h: { axis: 'y', amp: 4, freq: 1, phase: 'cos', kind: 'decay' }, fn: 'f3' },
        { d: 'flatten', h: { axis: 'y', amp: 3, freq: 1, phase: 'cos', kind: 'const' }, fn: 'f8' }
      ] },
    { h: { axis: 'x', amp: 4, freq: 1, phase: 'sin' }, fns: ['f1', 'f7', 'f10'],
      bad: [
        { d: 'drift', h: { axis: 'x', amp: 3, freq: 1, phase: 'sin', kind: 'ramp' }, fn: 'f2' },
        { d: 'wobble', h: { axis: 'y', amp: 2.5, freq: 6, phase: 'cos' }, fn: 'f10' }
      ] },
    { h: { axis: 'x', amp: -2, freq: 3, phase: 'sin' }, fns: ['f1', 'f3', 'f6'],
      bad: [
        { d: 'sink', h: { axis: 'y', amp: -6, freq: 1, phase: 'cos', kind: 'ramp' }, fn: 'f3' },
        { d: 'open', h: { axis: 'y', amp: 5, freq: 1, phase: 'cos', kind: 'ramp' }, fn: 'f6' }
      ] },
    { h: { axis: 'x', amp: -2, freq: 3, phase: 'sin' }, fns: ['f12', 'f3', 'f10'],
      bad: [
        { d: 'break', h: { axis: 'x', amp: 6, freq: 1, phase: 'sin', kind: 'step' }, fn: 'f12' },
        { d: 'shrink', h: { axis: 'y', amp: 4, freq: 1, phase: 'cos', kind: 'decay' }, fn: 'f3' }
      ] },
    { h: { axis: 'y', amp: -2.5, freq: 2, phase: 'cos' }, key: true, fns: ['f7', 'f10', 'f6'],
      bad: [
        { d: 'flatten', h: { axis: 'y', amp: 3, freq: 1, phase: 'cos', kind: 'const' }, fn: 'f10' },
        { d: 'sink', h: { axis: 'y', amp: -6, freq: 1, phase: 'cos', kind: 'ramp' }, fn: 'f6' }
      ] },
    { h: { axis: 'y', amp: 5, freq: 1, phase: 'cos' }, fns: ['f13', 'f1', 'f3'],
      bad: [
        { d: 'void', h: { axis: 'x', amp: 0.6, freq: 5, phase: 'sin' }, fn: 'f3' },
        { d: 'flatten', h: { axis: 'y', amp: 3, freq: 1, phase: 'cos', kind: 'const' }, fn: 'f1' }
      ] },
    { h: { axis: 'y', amp: 4, freq: 1, phase: 'cos' }, key: true, fns: ['f1', 'f3', 'f10'],
      bad: [
        { d: 'void', h: { axis: 'y', amp: 0.6, freq: 6, phase: 'cos' }, fn: 'f3' },
        { d: 'flatten', h: { axis: 'y', amp: 3, freq: 1, phase: 'cos', kind: 'const' }, fn: 'f10' }
      ] },
    { h: { axis: 'y', amp: -2.5, freq: 2, phase: 'cos' }, key: true, fns: ['f1', 'f3', 'f6'],
      bad: [
        { d: 'shrink', h: { axis: 'y', amp: 4, freq: 1, phase: 'cos', kind: 'decay' }, fn: 'f3' },
        { d: 'drift', h: { axis: 'x', amp: 3, freq: 1, phase: 'sin', kind: 'ramp' }, fn: 'f6' }
      ] },
    { h: { axis: 'y', amp: -2, freq: 3, phase: 'cos' }, fns: ['f1', 'f9', 'f5'],
      bad: [
        { d: 'break', h: { axis: 'x', amp: 5, freq: 1, phase: 'sin', kind: 'step' }, fn: 'f9' },
        { d: 'drift', h: { axis: 'x', amp: 3, freq: 1, phase: 'sin', kind: 'ramp' }, fn: 'f5' }
      ] },
    { h: { axis: 'y', amp: 4, freq: 1, phase: 'cos' }, fns: ['f7', 'f3', 'f5'],
      bad: [
        { d: 'flatten', h: { axis: 'y', amp: 3, freq: 1, phase: 'cos', kind: 'const' }, fn: 'f3' },
        { d: 'void', h: { axis: 'x', amp: 0.6, freq: 5, phase: 'sin' }, fn: 'f5' }
      ] },
    { h: { axis: 'y', amp: -1, freq: 4, phase: 'cos' }, fns: ['f14', 'f3', 'f7'],
      bad: [
        { d: 'flatten', h: { axis: 'y', amp: 3, freq: 1, phase: 'cos', kind: 'const' }, fn: 'f3' },
        { d: 'wobble', h: { axis: 'x', amp: 2.5, freq: 5, phase: 'sin' }, fn: 'f7' }
      ] }
  ];

  var optionMeta = {
    s1a: { next: 's2', bridge: '那天你们坐到公园关门，她合上书，说下次再聊。' },
    s1b: { next: 's3', bridge: '你绕湖走了一圈，回来时长椅已经空了。' },
    s1c: { next: 's13', bridge: '她抬头看见你，把书往旁边挪了挪，留出半个座位。' },

    s2a: { next: 's14', bridge: '你先出了咖啡馆，玻璃上的水汽被雨后的风吹散。' },
    s2b: { next: 's9', bridge: '第二杯喝到一半，雨停了，你们谁也没先提走。' },
    s2c: { next: 's14', bridge: '你把字条压在她杯底，出门后才想起没署名。' },
    s3a: { next: 's9', bridge: '车门打开时，你们上了同一节车厢。' },
    s3b: { next: 's14', bridge: '你上了后面那节车厢，隔着两扇门看见她低头看手机。' },
    s3c: { next: 's14', bridge: '她报了一个站名，你记了很久。' },
    s13a: { next: 's9', bridge: '你在长椅上坐下，把书放在两个人中间。' },
    s13b: { next: 's14', bridge: '你在路灯下翻开那本书，扉页有她的字。' },
    s13c: { next: 's14', bridge: '你把书挂在树枝上，给她发了定位。' },

    s9a: { next: 's4', bridge: '雪落在你们肩上，她把围巾往你这边挪了一点。' },
    s9b: { next: 's5', bridge: '你站了一会儿，说天冷，先走了。' },
    s9c: { next: 's5', bridge: '你拉着她去了便利店，暖气把玻璃蒙白。' },
    s14a: { next: 's4', bridge: '你把靠里的位置让给她，等她先开口。' },
    s14b: { next: 's5', bridge: '你一直看时间，她顺着你的目光看见了末班车。' },
    s14c: { next: 's5', bridge: '你说太晚了，她站起来，把围巾重新围好。' },

    s4a: { next: 's15', bridge: '你跟上她，脚印并排了一小段。' },
    s4b: { next: 's16', bridge: '你留在堤岸上，看她的背影一点点变小。' },
    s4c: { next: 's16', bridge: '她回头了，但海风把你要说的话吹散。' },
    s5a: { next: 's15', bridge: '消息发出去之后，你把手机扣在桌上，很久没敢翻。' },
    s5b: { next: 's16', bridge: '屏幕暗下去，那句话留在草稿里。' },
    s5c: { next: 's16', bridge: '你改到天亮，最后一个字也没发出去。' },

    s15a: { next: 's6', bridge: '你说想和她一起过年，她笑了一下，没有回答。' },
    s15b: { next: 's6', bridge: '你只说了新年快乐，烟花在你们头顶炸开。' },
    s15c: { next: 's6', bridge: '你什么都没说，烟花一朵一朵落下去。' },
    s16a: { next: 's6', bridge: '你把蛋糕推到她面前，她低头说了句谢谢。' },
    s16b: { next: 's6', bridge: '你在便签上写了一句生日快乐，压在她的杯底。' },
    s16c: { next: 's6', bridge: '你替她拉开椅子，她坐下后还是没抬头。' },

    s6a: { next: 's10', bridge: '你问出那句话，红灯在这时变绿。' },
    s6b: { next: 's17', bridge: '你们谁都没说话，绿灯亮起时一起过了马路。' },
    s6c: { next: 's17', bridge: '你笑了笑，说那就算了；她也笑，眼睛却没有。' },

    s10a: { next: 's11', bridge: '你说没关系，把那杯热的推到她面前。' },
    s10b: { next: 's11', bridge: '你说“你其实不用来”，然后站起来。' },
    s10c: { next: 's11', bridge: '你什么都没提，照常问她想喝什么。' },
    s17a: { next: 's11', bridge: '你买下那本书，坐在长椅上翻完了一章。' },
    s17b: { next: 's11', bridge: '你拍下扉页发给她，问她还要不要。' },
    s17c: { next: 's11', bridge: '你把书放回摊上，走了几步又回头。' },

    s11a: { next: 's7', bridge: '你把不想她走的话说完了，天台上风很大。' },
    s11b: { next: 's7', bridge: '你说那挺好的，祝她顺利。' },
    s11c: { next: 's7', bridge: '你陪她站到天亮，一句话也没说。' },

    s7a: { next: 's12', bridge: '你走进站台，叫住了她。' },
    s7b: { next: 's12', bridge: '你转身离开，照常去上那节课。' },
    s7c: { next: 's12', bridge: '你追着车窗跑了一段，直到站台尽头。' },

    s12a: { next: 's18', bridge: '你把钥匙和便签一起寄去了她的新地址。' },
    s12b: { next: 's18', bridge: '你把钥匙放回鞋柜，关上门。' },
    s12c: { next: 's18', bridge: '你把钥匙扔进垃圾桶，雨声盖住了那一下。' },

    s18a: { next: 's8', bridge: '你把她的东西收进纸箱，发消息问她新地址。' },
    s18b: { next: 's8', bridge: '你在那把空椅子上坐了一会儿。' },
    s18c: { next: 's8', bridge: '你关灯离开，把钥匙留在鞋柜上。' },

    s8a: { next: null },
    s8b: { next: null },
    s8c: { next: null }
  };

  var chatMeta = {
    c1: {
      first: [
        { next: 's14', flags: ['next_time'], bridge: '她说“看时间吧”。再见面已经是冬天，地点在地铁口的便利店。' },
        { next: 's9', flags: ['care'], bridge: '她说“到了”。下一场雪落下时，你们又在公园碰见。' },
        { next: 's9', flags: ['book'], bridge: '她说书还在她那里。冬天第一场雪落下时，长椅上多了一个人。' }
      ],
      second: [
        { flags: ['ask_now'], bridge: '你说“现在问吧”，她却没有把话说下去。' },
        { flags: ['let_go'], bridge: '你说早点睡，她回了一个“嗯”。' },
        { flags: ['wait_long'], bridge: '你说改天，她说过别等太久。' }
      ]
    },
    c2: {
      first: [
        { next: 's16', flags: ['busy'], bridge: '你说“你先忙”。她的生日那天，你还是提着蛋糕去了。' },
        { next: 's15', flags: ['wait'], bridge: '你说“我等你”。除夕夜她问你有没有地方去。' },
        { next: 's15', flags: ['worry'], bridge: '你问是不是发生了什么。她只说有点累。' }
      ],
      second: [
        { flags: ['talk_late'], bridge: '你说“还没”，于是那晚你们聊到很晚。' },
        { flags: ['let_sleep'], bridge: '你催她快睡，她说好。' },
        { flags: ['insomnia'], bridge: '你问她三点还不睡，她说睡不着。' }
      ]
    },
    c3: {
      first: [
        { flags: ['safe'], bridge: '你说一路顺利。她到站时，风已经很大了。' },
        { flags: ['care'], bridge: '你说照顾好自己，她回“你也是”。' },
        { flags: ['sendoff'], bridge: '你说本来想去送她，她说所以才没告诉你车次。' }
      ],
      second: [
        { flags: ['book_gift'], bridge: '你说书不用还，她还是带走了。' },
        { flags: ['arrival'], bridge: '你让她到了说一声，她说这趟车很慢。' },
        { flags: ['farewell'], bridge: '你说一路顺风，她回谢谢。' }
      ]
    },
    c4: {
      first: [
        { flags: ['snow_seen'], bridge: '你说看见了，雪很大。' },
        { flags: ['no_snow'], bridge: '你说这边没有雪。她说那我们不一样。' },
        { flags: ['late_awake'], bridge: '你问她怎么还没睡。她说睡不着。' }
      ],
      second: [
        { flags: ['photo_ok'], bridge: '你说糊的也看，她真的发来了。' },
        { flags: ['cold_out'], bridge: '你让她回屋里，她说再站一会儿。' },
        { flags: ['tomorrow'], bridge: '你说明天再拍，她说雪明天就化了。' }
      ]
    },
    c5: {
      first: [
        { flags: ['new_home'], bridge: '你说那就好。她说比原来那间大一点。' },
        { flags: ['offer_help'], bridge: '你问需不需要帮忙，她说都收拾好了。' },
        { flags: ['address'], bridge: '你让她把地址发来，她问发你干嘛。' }
      ],
      second: [
        { flags: ['quiet_ok'], bridge: '你说安静也好。她说就是有点不习惯。' },
        { flags: ['call_ok'], bridge: '你问要不要打电话，她说可以。' },
        { flags: ['adjust'], bridge: '你说早点适应，她说我试试。' }
      ]
    }
  };

  var sceneEchoes = {
    s2: [
      { if: { choice: 's1a' }, text: '你还记得自己坐到她身边时，她往旁边挪了挪。' }
    ],
    s3: [
      { if: { choice: 's1b' }, text: '你本来已经沿湖走开，却又在站台遇见她。' },
      { if: { choice: 's1c' }, text: '她还记得你停在几步外的样子。' }
    ],
    s13: [
      { if: { choice: 's1c' }, text: '那天你停在几步外，今天终于坐到了她身边。' }
    ],
    s9: [
      { if: { visited: 's2' }, text: '初秋你们也坐过这张长椅，那时椅子上还没有雪。' },
      { if: { visited: 's13' }, text: '还书那天她站在长椅旁边，现在她坐在你身边。' }
    ],
    s14: [
      { if: { visited: 's3' }, text: '站台的风和末班车那晚一样。' },
      { if: { visited: 's13' }, text: '她说过的那本书，还放在你的包里。' }
    ],
    s4: [
      { if: { visited: 's9' }, text: '雪化以后，海风比冬天更冷。' },
      { if: { visited: 's14' }, text: '站台的关东煮味道，被海风吹散了。' }
    ],
    s5: [
      { if: { flag: 'book' }, text: '对话框上方，是那本一直没还的书。' }
    ],
    s15: [
      { if: { visited: 's9' }, text: '你们从雪里走到烟花下。' }
    ],
    s16: [
      { if: { flag: 'worry' }, text: '她那晚只说过“有点累”。' },
      { if: { flag: 'wait' }, text: '你说过“我等你”，她当时没有回答。' }
    ],
    s6: [
      { if: { flag: 'wait' }, text: '你想起凌晨那句“我不确定要多久”。' },
      { if: { visited: 's15' }, text: '除夕夜她问过你想要什么，你没有回答。' }
    ],
    s10: [
      { if: { visited: 's2' }, text: '还是靠窗的位置，杯子的位置和上一次一样。' }
    ],
    s17: [
      { if: { choice: 's6b' }, text: '你想起红灯下她没说出口的那句话。' },
      { if: { choice: 's6c' }, text: '你想起自己笑着说“那就算了”。' }
    ],
    s11: [
      { if: { flag: 'worry' }, text: '你想起那晚她只说“有点累”。' }
    ],
    s7: [
      { if: { visited: 's11' }, text: '天台上没说完的话，在站台上又堵了一次。' },
      { if: { visited: 's4' }, text: '海边的风也是这样的，只是那天她没有回头。' }
    ],
    s12: [
      { if: { flag: 'sendoff' }, text: '她说所以才没告诉你车次，你在空站台上站了很久。' }
    ],
    s18: [
      { if: { flag: 'address' }, text: '她最终把新地址发给了你。' },
      { if: { flag: 'call_ok' }, text: '那通电话之后，房间显得更安静了。' }
    ],
    s8: [
      { if: { visited: 's4' }, text: '你想起退潮以后的海，和那排很快消失的脚印。' },
      { if: { flag: 'book' }, text: '那本书她一直没还。' },
      { if: { visited: 's15' }, text: '那年除夕的烟花，她看得很认真。' },
      { if: { flag: 'wait' }, text: '你想起自己说过“我等你”。' },
      { if: { flag: 'sendoff' }, text: '你想起她说“所以才没告诉你车次”。' }
    ]
  };

  function cloneH(h) {
    var out = { axis: h.axis, amp: h.amp, freq: h.freq, phase: h.phase };
    if (h.kind) out.kind = h.kind;
    return out;
  }

  var slotOf = {};
  slotScenes.forEach(function (ids, i) {
    ids.forEach(function (id) { slotOf[id] = i + 1; });
  });

  scenes.forEach(function (scene) {
    scene.slot = slotOf[scene.id] || scene.slot;
    scene.options.forEach(function (opt) {
      var meta = optionMeta[opt.id];
      if (!meta) return;
      if (meta.next !== undefined) opt.next = meta.next;
      if (meta.bridge) opt.bridge = meta.bridge;
      if (meta.flags) opt.flags = meta.flags;
    });
  });

  chats.forEach(function (chat) {
    var meta = chatMeta[chat.id];
    if (!meta) return;
    if (meta.first) {
      chat.replies.forEach(function (reply, i) {
        if (meta.first[i]) Object.assign(reply, meta.first[i]);
      });
    }
    if (meta.second && chat.second) {
      chat.second.replies.forEach(function (reply, i) {
        if (meta.second[i]) Object.assign(reply, meta.second[i]);
      });
    }
  });

  scenes.forEach(function (scene) {
    scene.echoes = sceneEchoes[scene.id] || [];
    var sm = slotMath[scene.slot - 1];
    if (!sm) return;
    var target = scene.slot === 2 ? 1 : 0;
    var sincereIdx = -1;
    scene.options.forEach(function (opt, i) {
      if (sincereIdx < 0 && (opt.sincere || opt.weight > 0)) sincereIdx = i;
    });
    if (sincereIdx < 0) sincereIdx = 0;
    var sincere = scene.options.splice(sincereIdx, 1)[0];
    sincere.sincere = true;
    scene.options.splice(target, 0, sincere);
    var badOrdinal = 0;
    scene.options.forEach(function (opt, i) {
      if (i === target) {
        opt.weight = 1;
        opt.key = !!sm.key;
        opt.h = cloneH(sm.h);
        opt.fn = sm.fns[i];
        opt.op = '+';
        delete opt.d;
      } else {
        var bad = sm.bad[badOrdinal] || sm.bad[0];
        opt.weight = 0;
        opt.key = false;
        opt.h = cloneH(bad.h);
        opt.fn = bad.fn;
        opt.d = bad.d;
        opt.op = badOrdinal === 0 ? '−' : '÷';
        badOrdinal += 1;
      }
    });
  });

  var sceneById = {};
  scenes.forEach(function (scene) { sceneById[scene.id] = scene; });

  root.FAREWELL_DATA = {
    functions: functions,
    functionOrder: ['f1', 'f2', 'f11', 'f6', 'f12', 'f8', 'f3', 'f7', 'f4', 'f10', 'f15', 'f5', 'f13', 'f14', 'f9'],
    scenes: scenes,
    prologue: prologue,
    interludes: interludes,
    chats: chats,
    beats: beats,
    openings: openings,
    endings: endings,
    endingsOrder: ['good', 'jump', 'asymptote', 'decay', 'sine', 'parabola', 'log', 'flat', 'drift'],
    slotCount: slotScenes.length,
    slots: slotScenes,
    sceneById: sceneById,
    story: { slotMath: slotMath, optionMeta: optionMeta, chatMeta: chatMeta, echoes: sceneEchoes },
    axisReading: {
      x: '主动、靠近与付出',
      y: '回应、结果与感受',
      note: '把曲线当作理解关系的一种隐喻，不是付出必然换来回应的公式。'
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---------- 聊天 flag → 后续记忆（补齐）：聊天的每个回复都会在后面的场景里留下痕迹 ---------- */
(function (root) {
  var D = root.FAREWELL_DATA;
  if (!D || !D.sceneById) return;
  var extra = {
    s9: [
      { if: { flag: 'ask_now' }, text: '那天她说「现在问吧，我在」，你没问。这个没问后来一直跟着你。' },
      { if: { flag: 'let_go' }, text: '你说过「那你早点睡」。之后你们的很多对话，都是这样结束的。' }
    ],
    s14: [
      { if: { flag: 'next_time' }, text: '她说过「下次换我请你」。这个下次来得比你预想的晚。' },
      { if: { flag: 'wait_long' }, text: '你说「好，那改天」。改天拖到了冬天。' }
    ],
    s15: [
      { if: { flag: 'busy' }, text: '她说最近有点忙。后来你看见她发过一张深夜的办公桌。' },
      { if: { flag: 'let_sleep' }, text: '你回「快睡吧」那次之后，她真的没再半夜找过你。' }
    ],
    s16: [
      { if: { flag: 'talk_late' }, text: '凌晨三点那次你说「还没，怎么了」。她后来把这句话记住了。' },
      { if: { flag: 'insomnia' }, text: '你说「三点了还不睡」，她说房间太安静。这件事你没跟别人提过。' }
    ],
    s6: [
      { if: { flag: 'snow_seen' }, text: '那场雪你回「看见了，很大」。她拍的照片一直没发出来。' },
      { if: { flag: 'no_snow' }, text: '她那边下雪，你这边没有。那天的对话停在「有点可惜」。' },
      { if: { flag: 'late_awake' }, text: '凌晨两点她问你怎么还没睡。你说了实话，只说了这一句。' },
      { if: { flag: 'photo_ok' }, text: '你说「糊的也看」。她把那张糊掉的照片发给了你。' },
      { if: { flag: 'cold_out' }, text: '你让她回屋里。她回了句「再站一会儿」。' },
      { if: { flag: 'tomorrow' }, text: '你说「明天再拍」。第二天雪化了。' }
    ],
    s10: [
      { if: { flag: 'tomorrow' }, text: '说好明天再拍的那张雪景，后来用一张旧照片代替了。' }
    ],
    s12: [
      { if: { flag: 'safe' }, text: '她说「一路顺利」。这句话你听着像一句普通祝福。' },
      { if: { flag: 'book_gift' }, text: '你说「书你不用还」。那本书就一直留在她那里。' },
      { if: { flag: 'arrival' }, text: '「到了说一声」——她到了，隔了二十分钟才说。' },
      { if: { flag: 'farewell' }, text: '「一路顺风」是那天你们说的最后一句话。' },
      { if: { flag: 'care' }, text: '「照顾好自己」这句，你说得比她自然。' }
    ],
    s18: [
      { if: { flag: 'new_home' }, text: '她说找到了朝南的房子。你记得她怕冷。' },
      { if: { flag: 'offer_help' }, text: '你问要不要帮忙搬家，她说都收拾好了。' },
      { if: { flag: 'quiet_ok' }, text: '你说「安静也好」。她回了一个嗯。' },
      { if: { flag: 'adjust' }, text: '你说「早点适应」。她适应了，只是比你以为的慢。' }
    ]
  };
  Object.keys(extra).forEach(function (id) {
    var sc = D.sceneById[id];
    if (!sc) return;
    if (!Array.isArray(sc.echoes)) sc.echoes = [];
    extra[id].forEach(function (e) { sc.echoes.push(e); });
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* ---------- 聊天记忆：每条消息都要接得上刚刚发生的选择 ---------- */
(function (root) {
  var D = root.FAREWELL_DATA;
  if (!D || !D.chats) return;
  var byId = {};
  D.chats.forEach(function (c) { byId[c.id] = c; });
  var lines = {
    c1: [
      { if: { choice: 's2a' }, text: '你先起身的时候，我其实还想再坐一会儿。' },
      { if: { choice: 's2b' }, text: '第二杯是我请的，别记错了。' },
      { if: { choice: 's2c' }, text: '那张字条我收起来了，一直没丢。' },
      { if: { choice: 's3a' }, text: '末班车上你站得离我很近。' },
      { if: { choice: 's3b' }, text: '你换了车厢，我从门缝里看见你了。' },
      { if: { choice: 's3c' }, text: '你问我坐到哪，我其实坐过了站。' },
      { if: { choice: 's13a' }, text: '书还你了，扉页上的字你没看见吧。' },
      { if: { choice: 's13b' }, text: '你在路灯下翻书的样子，我看见了。' },
      { if: { choice: 's13c' }, text: '书挂在树上，我够了好久。' }
    ],
    c2: [
      { if: { choice: 's4a' }, text: '退潮以后你一直跟着我走。' },
      { if: { choice: 's4b' }, text: '你留在原地，我就没回头。' },
      { if: { choice: 's4c' }, text: '你喊我回头那次，我听见了。' },
      { if: { choice: 's5a' }, text: '那条消息我看了三遍。' },
      { if: { choice: 's5b' }, text: '你关掉屏幕的时候，我在等。' },
      { if: { choice: 's5c' }, text: '你改了很久，最后发过来的只有两个字。' }
    ],
    c4: [
      { if: { choice: 's16b' }, text: '便签我看到了，压在杯底那张。' },
      { if: { choice: 's16a' }, text: '蛋糕我吃完了，谢谢你。' },
      { if: { choice: 's16c' }, text: '椅子我自己会拉，不过还是谢谢你。' },
      { if: { choice: 's15a' }, text: '烟花那晚你靠着栏杆，一句话没说。' },
      { if: { choice: 's15b' }, text: '书还给我了，我一直没翻开。' },
      { if: { choice: 's15c' }, text: '月亮那晚，你比我先走。' }
    ],
    c3: [
      { if: { choice: 's7a' }, text: '你走进站台的时候，我回头了。' },
      { if: { choice: 's7b' }, text: '你转身走了，我车开的时候才敢看门口。' },
      { if: { choice: 's7c' }, text: '你追着车跑，别这样，很危险。' }
    ],
    c5: [
      { if: { choice: 's12a' }, text: '东西你寄回来了，我签收了。' },
      { if: { choice: 's12b' }, text: '你什么都没拿走，我知道。' },
      { if: { choice: 's12c' }, text: '你把它扔了，我看见了。' }
    ]
  };
  Object.keys(lines).forEach(function (id) {
    var c = byId[id];
    if (!c) return;
    c.echoes = (c.echoes || []).concat(lines[id]);
  });
})(typeof window !== 'undefined' ? window : globalThis);
