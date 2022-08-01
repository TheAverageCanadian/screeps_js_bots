/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role_carrier');
 * mod.thing == 'a thing'; // true
 */
var role_carrier = {
    /** @param {Creep} creep  **/
    run: function(creep) {
        if(creep.store.energy < creep.store.getCapacity()) { // Creep's inv not full
            get_energy(creep);
        } else { //creep is full
            let targets = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) 
                            && (structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0));
                }
            })
            if(targets.length != 0){
                let target = creep.pos.findClosestByPath(targets);
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
        }
    }
};

function get_energy(creep) {
    let nDrop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
    if(creep.pickup(nDrop) == ERR_NOT_IN_RANGE) {
        creep.moveTo(nDrop);
    }
}

module.exports = role_carrier;