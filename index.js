var isMount = true
var workInProgressHook = null
const fiber = {
    stateNode: null,
    memorizeState: workInProgressHook
 }

function schedule () {
    workInProgressHook = fiber.memorizeState // 重要
    const app =  App()
    isMount = false
    return app
}

// queue是一个队列，是当前hook中的queue，action是执行update操作时的入参函数
const dispatcher = (queue, action) =>  {
    // 创建一种数据结构
     const update = {
        action,
        next: null,
     }
     // dispatcher其实就是来修改这条queue的
     if(queue.pending === null) {
        update.next = update
     } else {
        // queue.pending = u0 - u0
        // u0 ->  queue.pending = u1 -> u0
        update.next = queue.pending.next
        queue.pending.next = update 
     }
     queue.pending = update // queue.pending 都是指向最后一个
     schedule()
}

function useState(initValue) {
    var hook
    if(isMount) {
        // mount时每个useState都会创建一个hook对象
        hook = {
            memorizeState:  initValue, // 值
            queue: {
                pending: null, // pending的值就是一个链表，所以不需要再action对象中夹next属性了
                // next: null,
            }, // 修改函数
            next: null, // 下一个hook
        }
        if(workInProgressHook) {
            // mount时，同时存在多个useState
            workInProgressHook.next = hook
        } else {
            fiber.memorizeState = hook // fiber.memorizeState 里面存的才是hook的链表
        }
        workInProgressHook = hook
    }  else {
        // update时
        hook = workInProgressHook
        workInProgressHook = hook.next
    }

    //
    let baseValue = hook.memorizeState
    
    if(hook.queue.pending) {
        // debugger
        let firstAction = hook.queue.pending.next
        do{ // 遍历当前hook中的action函数，直到值为自己（因为是一个环状链表）
            baseValue = firstAction.action(baseValue)
            firstAction = firstAction.next
        }while(firstAction !== hook.queue.pending) //
        hook.queue.pending = null
    }
    
    hook.memorizeState = baseValue


    return [baseValue, dispatcher.bind(null, hook.queue)] // 为更新函数添加绑定参数，为了能让更新函数知道对应哪个useState
}

function App () {
    const [num, setNum] = useState(1)
    const [num1, setNum1] = useState(10)
    console.log('num', num)
    console.log('num1', num1)
    return {
        onClick() {
            setNum(n => n + 1)
            setNum(n => n + 1)
        },
        onFocus() {
            setNum1(n => n + 10)
        }
    }
}

const app = schedule()