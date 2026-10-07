
window.FUPAN_DATA = {
  courses: [
    {id:"python", name:"Python程序设计"},
    {id:"database", name:"数据库基础"},
    {id:"ai", name:"人工智能基础"}
  ],
  cases: [
    {
      id:"demo_py_acc", course:"python", type:"wrong",
      title:"Python赋值与累加混淆",
      prompt:"下面代码执行后，x 的值是多少？\n\nx = 1\nx = x + 1\nx = x + 1",
      originalAnswer:"我觉得还是1，因为x一开始等于1。",
      thought:"我把 x = x + 1 理解成只是一个公式，没有想到它会更新变量。",
      diagnosis:"关键问题是把“赋值语句”和“数学等式”混淆了。Python 中右侧先计算，再把结果重新赋给左侧变量。",
      category:"概念理解", kp:"变量赋值与更新",
      question:"执行第一句 x = x + 1 后，右边的 x 是多少？计算结果会被保存到哪里？",
      hints:[
        "先只看第一句 x = x + 1：右边先取旧值。",
        "旧的 x=1，所以右侧 1+1=2，然后把 2 重新保存进 x。",
        "因此第一次更新后 x=2，第二次再做 2+1，最终 x=3。"
      ],
      practice:{q:"若 a=2，依次执行 a=a+3 和 a=a*2，最终 a 是多少？", answer:"10", explanation:"先得到5，再乘2得到10。"}
    },
    {
      id:"demo_range", course:"python", type:"wrong",
      title:"Python循环边界错误",
      prompt:"为什么下面代码只输出1到4，没有输出5？\n\nfor i in range(1,5):\n    print(i)",
      originalAnswer:"我以为 range(1,5) 就是从1到5。",
      thought:"我没有注意 range 的结束值规则。",
      diagnosis:"range(start, stop) 包含 start，但不包含 stop，因此 range(1,5) 产生1、2、3、4。",
      category:"条件识别", kp:"range边界",
      question:"如果你希望输出1到5，stop 应该写成多少？",
      hints:["记住口诀：左闭右开。","stop 不会被包含，所以要比最后想要的数字大1。","写成 range(1,6)。"],
      practice:{q:"range(2,7) 一共产生几个整数？请写出这些整数。", answer:"5个：2,3,4,5,6", explanation:"结束值7不包含。"}
    },
    {
      id:"demo_index", course:"python", type:"code",
      title:"列表索引越界",
      prompt:"任务：打印列表最后一个元素。\n代码：\nnums=[10,20,30]\nprint(nums[3])",
      originalAnswer:"nums有3个元素，所以最后一个应该是nums[3]。",
      thought:"我把元素个数直接当成最大索引。",
      diagnosis:"Python列表索引从0开始。长度为3的列表合法索引是0、1、2，因此 nums[3] 越界。",
      category:"代码逻辑", kp:"列表索引",
      question:"长度为 n 的列表，最后一个元素的索引是什么？",
      hints:["索引从0开始。","长度3对应最大索引2。","可以使用 nums[2] 或 nums[-1]。"],
      practice:{q:"items=['a','b','c','d']，不运行代码，最后一个元素可用哪两个索引读取？", answer:"3 或 -1", explanation:"长度4的最大正索引为3，-1表示最后一个。"}
    },
    {
      id:"demo_sql", course:"database", type:"wrong",
      title:"SQL查询条件错误",
      prompt:"查询年龄大于18且城市为广州的学生。学生写：\nSELECT * FROM student WHERE age > 18 OR city='广州';",
      originalAnswer:"我用了OR，觉得两个条件写出来就行。",
      thought:"没有认真区分同时满足和满足其一。",
      diagnosis:"题目要求两个条件同时成立，应使用 AND；OR 会把只满足其中一个条件的记录也查出来。",
      category:"条件识别", kp:"WHERE逻辑条件",
      question:"“同时满足A和B”在逻辑上应该对应 AND 还是 OR？",
      hints:["想象集合交集。","AND要求两个条件都为真。","正确核心条件：age > 18 AND city='广州'。"],
      practice:{q:"要查询成绩>=60且班级='AI1'，WHERE 条件应如何写？", answer:"score >= 60 AND class='AI1'", explanation:"“且”对应AND。"}
    },
    {
      id:"demo_split", course:"ai", type:"wrong",
      title:"混淆训练集与测试集用途",
      prompt:"某同学不断查看测试集结果并据此调模型参数，这有什么问题？",
      originalAnswer:"测试集准确率高就说明模型更好了，所以可以一直看。",
      thought:"我把测试集当成调参依据。",
      diagnosis:"测试集应该尽量只用于最终评估。反复根据测试集结果调参会让模型间接适应测试集，导致评估偏乐观。",
      category:"概念理解", kp:"训练/验证/测试集",
      question:"模型调参更适合参考训练集、验证集还是测试集？",
      hints:["测试集的角色更像期末考试。","调参通常参考验证集。","训练集用于学习参数，验证集用于选择/调参，测试集用于最终客观评估。"],
      practice:{q:"请用一句话分别说明训练集、验证集、测试集的主要用途。", answer:"训练集学习模型参数；验证集调参与模型选择；测试集最终评估。", explanation:"三者职责不同，避免信息泄漏。"}
    },
    {
      id:"demo_project", course:"ai", type:"project",
      title:"数据分析实训后缺少结果验证",
      prompt:"实训目标：完成学生成绩分析并给出结论。你已经画出了成绩分布图并写出‘大多数学生成绩较高’。",
      originalAnswer:"我觉得图看起来高分比较多，所以结论应该没问题。",
      thought:"我没有做数值统计，也没核对异常值。",
      diagnosis:"当前结论主要来自目测，证据不足。需要至少用描述统计、比例计算或异常值检查来验证图形观察。",
      category:"推理步骤", kp:"结果验证",
      question:"除了看图，你还能用哪一种数值指标验证“大多数成绩较高”？",
      hints:["可以统计某个分数阈值以上的人数比例。","也可以查看均值、中位数和分位数。","例如计算80分以上学生占比，并结合中位数与异常值检查。"],
      practice:{q:"若100名学生中有68人成绩>=80，可以怎样更严谨地描述结果？", answer:"68%的学生成绩达到80分及以上；还应结合中位数、分布和异常值进一步说明。", explanation:"用可验证数字替代笼统判断。"}
    }
  ],
  bank: [
    {id:"q1",course:"python",kp:"range边界",type:"单选题",difficulty:"基础",q:"range(1,4) 会生成哪些整数？",options:["1,2,3","1,2,3,4","0,1,2,3","2,3,4"],answer:"1,2,3",explanation:"stop=4不包含。",reviewStatus:"已审核"},
    {id:"q2",course:"python",kp:"列表索引",type:"判断题",difficulty:"基础",q:"长度为5的列表，合法最大正索引是5。",answer:"错误",explanation:"索引从0开始，最大正索引为4。",reviewStatus:"已审核"},
    {id:"q3",course:"database",kp:"WHERE逻辑条件",type:"简答题",difficulty:"基础",q:"AND与OR在WHERE条件中有什么区别？",answer:"AND要求条件同时满足；OR要求至少一个条件满足。",explanation:"两者对应不同逻辑关系。",reviewStatus:"已审核"},
    {id:"q4",course:"ai",kp:"训练/验证/测试集",type:"简答题",difficulty:"基础",q:"为什么不应该反复根据测试集结果调参？",answer:"会造成对测试集的信息泄漏或间接过拟合，使最终评估偏乐观。",explanation:"测试集应保留用于最终客观评估。",reviewStatus:"AI生成，待教师审核"}
  ],
  materials:[
    {id:"m1",course:"python",title:"Python课程知识要点（演示）",source:"教师资料示例",content:"变量赋值、循环、列表与函数基础。",isDemo:true},
    {id:"m2",course:"database",title:"SQL基础知识要点（演示）",source:"教师资料示例",content:"SELECT、WHERE、AND/OR、JOIN、GROUP BY。",isDemo:true},
    {id:"m3",course:"ai",title:"机器学习基础知识要点（演示）",source:"教师资料示例",content:"训练集、验证集、测试集及基础评估概念。",isDemo:true}
  ]
};
