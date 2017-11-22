"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var State;
(function (State) {
    State[State["Created"] = 0] = "Created";
    State[State["Accepted"] = 1] = "Accepted";
    State[State["Declined"] = 2] = "Declined";
    State[State["Canceled"] = 3] = "Canceled";
})(State = exports.State || (exports.State = {}));
var EscrowState;
(function (EscrowState) {
    EscrowState[EscrowState["Created"] = 0] = "Created";
    EscrowState[EscrowState["Refunded"] = 1] = "Refunded";
    EscrowState[EscrowState["Released"] = 2] = "Released";
})(EscrowState = exports.EscrowState || (exports.EscrowState = {}));
//# sourceMappingURL=types.js.map