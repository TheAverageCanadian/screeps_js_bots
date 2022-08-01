/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role_builter');
 * mod.thing == 'a thing'; // true
 */
var role_builder = {
    /** @param {Creep} creep  **/
    run: function(creep) {

        if(creep.memory.building && creep.store.energy == 0) { // building and out of energy
            creep.memory.building = false;                     //go get more energy
            creep.say("⛏ Refill");
            get_energy(creep);
        } else if(creep.memory.building) {                 //building and not out of energy
            build(creep);                                   // keep building
        } else if(creep.store.energy != 50) {               //not building, not full energy yet, also not empty
            get_energy(creep);                              // keep getting energy
        }  else {                                           //not building, energy full
            creep.memory.building = true;                  // start building
            creep.say("🛠 Build");
            build(creep);
        }
    }
};

function get_energy(creep) {
    let nSource = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {algorithm: "astar"});
    if(creep.harvest(nSource) == ERR_NOT_IN_RANGE) {
        creep.moveTo(nSource);
    }
}

function build(creep) {
    let target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, )
    if(creep.build(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
}

module.exports = role_builder;