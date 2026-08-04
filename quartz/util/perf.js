import pretty from "pretty-time";
import { styleText } from "util";
export class PerfTimer {
    evts;
    constructor() {
        this.evts = {};
        this.addEvent("start");
    }
    addEvent(evtName) {
        this.evts[evtName] = process.hrtime();
    }
    timeSince(evtName) {
        return styleText("yellow", pretty(process.hrtime(this.evts[evtName ?? "start"])));
    }
}
