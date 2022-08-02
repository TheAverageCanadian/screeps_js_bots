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
        if(creep.memory.paired_harv == null) { // if unpaired, pair with a harvester
            pairWithHarv(creep);
        }
        if(creep.store.energy < creep.store.getCapacity()) { // Creep's inv not full
            get_energy(creep);
        } else { //creep is full
            let targets = creep.room.find(FIND_MY_STRUCTURES, { // find extensions and spawns that are not yet full
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) 
                            && (structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0));
                }
            })
            if(targets.length == 0){ // if no unfilled extensions or spawns can be found, find containers or storages instead
                targets = creep.room.find(FIND_MY_STRUCTURES, { 
                    filter: (structure => {
                        return ((structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE)
                                && (structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0));
                    })
                })
            } else { // move to the closest target and fill it
                let target = creep.pos.findClosestByPath(targets);
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
        }
    }
};
function pairWithHarv(creep) {
    let miner = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
        filter: (creep) => {
            return ((creep.memory.role == "harvester") 
                    && (creep.memory.paired_crry == ""));
        }
    })
    if(miner != null) {
        creep.memory.paired_harv = miner.name;
        miner.memory.paired_crry = creep.name;  
    }
}

function unpairWithHarv(creep) {
    Game.creeps[creep.memory.paired_harv].memory.paired_crry = "";
    creep.memory.paired_harv = "";
}



function get_energy(creep) {
    let miner = Game.creeps[creep.memory.paired_harv];
    if(creep.pos.getRangeTo(miner) > 1) {
        creep.moveTo(miner);
    } else {
        //let nDrop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
        let drops = creep.room.find(FIND_DROPPED_RESOURCES);
        let bDrop = drops[0];
        for(let d in drops) {
            if(d.amount > bDrop.amount) {bDrop = d;}
        }
        if(creep.pickup(bDrop) == ERR_NOT_IN_RANGE) {
            creep.moveTo(bDrop);
        }
    }
}

module.exports = role_carrier;