/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role_upgrader');
 * mod.thing == 'a thing'; // true
 */
var role_upgrader = {
    /** @param {Creep} creep  **/
    run: function(creep) {

        if(creep.memory.upgrading && creep.store.energy == 0) { // upgrading and out of energy
            creep.memory.upgrading = false;                     //go get more energy
            creep.say("⛏");
            get_energy(creep);
        } else if(creep.memory.upgrading) {                 //upgrading and not out of energy
            upgrade_controller(creep);                      // keep upgrading
        } else if(creep.store.energy != 50) {               //not upgrading, not full energy yet
            get_energy(creep);                              // keep getting energy
        }  else {                                           //not upgrading, energy full
            creep.memory.upgrading = true;                  // start upgrading
            creep.say("🛠");
            upgrade_controller(creep);
        }
    }
};

function get_energy(creep) {
    let nDrop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES); // TODO: Prefer taking from containers/storages instead of dropped shit
    if(creep.pickup(nDrop) == ERR_NOT_IN_RANGE) {
        creep.moveTo(nDrop);
    }
    // let nSource = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {algorithm: "astar"});
    // if(creep.harvest(nSource) == ERR_NOT_IN_RANGE) {
    //     creep.moveTo(nSource);
    // }
}

function upgrade_controller(creep) {
    switch (creep.upgradeController(creep.room.controller)) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(creep.room.controller);
            break;
        case ERR_NOT_ENOUGH_RESOURCES:
            getEnergy(creep);
            break;
    }
}

module.exports = role_upgrader;