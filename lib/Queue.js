import { errorStack } from './logger.js';
// Generic promise queue (FIFO)
export default class dataq {
    qname;
    pool;
    Qprocessing;
    dataProcessor;
    context;
    constructor(cb, callerContext, name) {
        this.qname = name;
        this.pool = [];
        this.Qprocessing = 0;
        this.dataProcessor = cb;
        this.context = callerContext;
    }
    // this adds one item to the queue, and start processing it.
    add(item) {
        this.pool.push(item);
        this.process();
    }
    // This processes one item at a time until queue is empty.
    process() {
        const self = this;
        if (!this.Qprocessing && this.pool.length) {
            this.Qprocessing++;
            this.dataProcessor.call(this.context, this.pool.shift())
                .catch(function (err) {
                errorStack(err, 'Queue %s process error caught. ' +
                    'Currently processing %d:', self.qname, self.Qprocessing);
            })
                .then(function () {
                self.Qprocessing--;
                process.nextTick(function () {
                    self.process();
                });
            });
        }
    }
}
;
