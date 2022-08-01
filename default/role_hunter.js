const { find } = require("lodash");

/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role_hunter');
 * mod.thing == 'a thing'; // true
 */
var role_hunter = {
    /** @param {Creep} creep  **/
    run: function(creep) {
        hunt(creep);
    }
};

function get_energy(creep) {
    let nSource = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {algorithm: "astar"});
    if(creep.harvest(nSource) == ERR_NOT_IN_RANGE) {
        creep.moveTo(nSource);
    }
}

function hunt(creep) {
    let target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
    switch (creep.rangedAttack(target)) {
        case ERR_NOT_IN_RANGE:
            if(findDistance(creep.pos, target.pos) > 4) {
                creep.moveTo(target);
            }
            break;
        case ERR_NOT_ENOUGH_RESOURCES:
            getEnergy(creep);
            break;
        case ERR_NO_BODYPART:
            switch (creep.attack(target)) {
                case ERR_NOT_IN_RANGE:
                    creep.moveTo(target);
                    break;
                case ERR_NOT_ENOUGH_RESOURCES:
                    getEnergy(creep);
                    break;
            }
    }
}

function findDistance(p1, p2) {
    let xD = p2.x - p1.x;
    let yD = p2.y - p1.y;
    let vD = Math.sqrt((xD**2) + (yD**2));
    return vD;
}

module.exports = role_hunter;