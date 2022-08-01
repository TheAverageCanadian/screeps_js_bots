/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role_harvester');
 * mod.thing == 'a thing'; // true
 */
var role_harvester = {
    /** @param {Creep} creep  **/
    run: function(creep) {
        if(creep.store.energy < creep.store.getCapacity()) { // Creep's inv not full
            let nSource = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {algorithm: "astar"});
            if(creep.harvest(nSource) == ERR_NOT_IN_RANGE) {
                creep.moveTo(nSource);
            }
        } else { //creep is full
            if(creep.transfer(Game.spawns["spn_main"], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(Game.spawns["spn_main"]);
            }
        }
    }
};

module.exports = role_harvester;