var e={d:(t,s)=>{for(var i in s)e.o(s,i)&&!e.o(t,i)&&Object.defineProperty(t,i,{enumerable:!0,get:s[i]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t)},t={};e.d(t,{J:()=>a,A:()=>n});class s{data;compare;constructor(e){this.data=[],this.compare=e||function(e,t){return e-t}}push(e){const t=this.data.length;this.data[t]=e,this.shiftUp(t)}peek(){return this.data[0]}pop(){if(this.data.length<=1)return this.data.shift();const e=this.data[0],t=this.data.pop();return void 0!==t&&e!==t?(this.data[0]=t,this.shiftDown(0),e):e}shiftUp(e){for(;e>0;){const t=e>>>1,s=this.data[t],o=this.data[e];if(!(this.compare(s,o)>0))return;i(this.data,e,t),e=t}}shiftDown(e){const t=this.data.length,s=(t>>>1)-1;for(;e<=s;){const s=2*(e+1)-1,o=s+1,a=this.data[e],r=this.data[s],n=this.data[o];if(this.compare(a,r)>0)o<t&&this.compare(r,n)>0?(i(this.data,e,o),e=o):(i(this.data,e,s),e=s);else{if(!(o<t&&this.compare(a,n)>0))return;i(this.data,e,o),e=o}}}show(){const e=this.data;return e&&0!==e.length?function t(s,i,o){if(s>=e.length||null===e[s]||void 0===e[s])return"";const a=e[s],r=2*s+1;let n="";return n+=t(2*s+2,i+1,o+6),n+=" ".repeat(o)+a+"\n",n+=t(r,i+1,o+6),n}(0,0,0):""}toString=this.show;toJSON=this.show;valueOf=this.show}function i(e,t,s){const i=e[t];e[t]=e[s],e[s]=i}const o=(e,t)=>{const s=e.expirationTime-t.expirationTime;return 0!==s?s:e.id-t.id};var a;!function(e){e.IMMEDIATE_PRIORITY="IMMEDIATE_PRIORITY",e.USER_BLOCKING_PRIORITY="USER_BLOCKING_PRIORITY",e.NORMAL_PRIORITY="NORMAL_PRIORITY",e.LOW_PRIORITY="LOW_PRIORITY",e.IDLE_PRIORITY="IDLE_PRIORITY"}(a||(a={}));const r={[a.IMMEDIATE_PRIORITY]:-1,[a.USER_BLOCKING_PRIORITY]:250,[a.NORMAL_PRIORITY]:500,[a.LOW_PRIORITY]:1e3,[a.IDLE_PRIORITY]:Number.MAX_SAFE_INTEGER},n=new class{taskQueue=new s(o);timerQueue=new s(o);userTaskCnt=0;isMessageLoopRunning=!1;isHostCallbackScheduled=!1;isPerformingWork=!1;isHostTimeoutScheduled=!1;timerId=void 0;scheduleCallback(e=a.NORMAL_PRIORITY,t=()=>{},s=0){const i=performance.now(),o=i+s,n=o+(r[e]||r[a.NORMAL_PRIORITY]),h={id:this.userTaskCnt++,priorityLevel:e,startTime:o,expirationTime:n,callback:t,sortIndex:-1};o>i?(h.sortIndex=o,this.timerQueue.push(h),this.timerQueue.peek()===h&&(this.cancelHostTimeout(),this.requestHostTimeout(this.handleTimeout,h.startTime-performance.now()))):(h.sortIndex=n,this.taskQueue.push(h),this.isHostCallbackScheduled||this.isPerformingWork||(this.isHostCallbackScheduled=!0,this.requestHostCallback()))}requestHostCallback(){this.isMessageLoopRunning||(this.isMessageLoopRunning=!0,this.schedulePerformWorkUntilDeadline())}advacneTimers(){}handleTimeout(){if(this.isHostTimeoutScheduled=!1,this.advacneTimers(),!this.isHostTimeoutScheduled)if(this.taskQueue.peek())this.isHostTimeoutScheduled=!0,this.requestHostCallback();else{const e=this.timerQueue.peek();e&&this.requestHostTimeout(this.handleTimeout,e.startTime-performance.now())}}requestHostTimeout(e,t){this.isHostTimeoutScheduled||(this.isHostTimeoutScheduled=!0,this.timerId=setTimeout(e,t))}cancelHostTimeout(){this.isHostTimeoutScheduled&&(clearTimeout(this.timerId),this.timerId=void 0,this.isHostTimeoutScheduled=!1)}performWorkUntilDeadline(){if(this.isMessageLoopRunning){const e=performance.now();let t=!0;try{t=this.flushWork(e)}finally{t?this.schedulePerformWorkUntilDeadline():this.isMessageLoopRunning=!1}}}schedulePerformWorkUntilDeadline(){if("function"==typeof MessageChannel){const e=new MessageChannel;e.port2.onmessage=this.performWorkUntilDeadline.bind(this),e.port1.postMessage(null)}else setTimeout((()=>{this.performWorkUntilDeadline()}))}flushWork(e){this.isHostCallbackScheduled=!1,this.cancelHostTimeout(),this.isPerformingWork=!0;try{return this.workLoop(e)}finally{this.isPerformingWork=!1}}workLoop(e){let t=e;this.advacneTimers();let s=this.taskQueue.peek(),i=!1;for(;s&&(i=s.expirationTime<t,i||!this.shouldYieldHost(e));){const e=s.callback;if(s.callback=null,"function"==typeof e){const t=e(i);if("function"==typeof t)return s.callback=t,this.advacneTimers(),!0;s===this.taskQueue.peek()&&this.taskQueue.pop(),this.advacneTimers()}else this.taskQueue.pop();s=this.taskQueue.peek()}if(s)return!0;if(this.timerQueue.peek()){const e=this.timerQueue.peek();e&&this.requestHostTimeout(this.handleTimeout,e.startTime-performance.now())}return!1}shouldYieldHost(e){return performance.now()-e>5}};var h=t.J,u=t.A;export{h as PriorityLevel,u as default};