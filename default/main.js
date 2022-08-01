let role_harvester = require("role_harvester");
let role_upgrader = require("role_upgrader");
let role_builder = require("role_builder");

module.exports.loop = function () {
    for(let name in Game.creeps) { 
        let creep = Game.creeps[name];                      // Loop thru all creeps
        if (creep.ticksToLive <= 250) {                     // Renew life of expiring creeps
            creep.memory.recharging = true;
            creep.say("🔋 Low pwr")
        } 
        if(creep.memory.recharging) {   
            keepCreepAlive(creep);
        } else {                                                   
            switch(creep.memory.role) {                         // Perform role-specific actions
                case "harvester":
                    role_harvester.run(creep);
                    break;
                case "upgrader":
                    role_upgrader.run(creep);
                    break;
                case "builder":
                    role_builder.run(creep);
                    break;
            }
        }
    }
}

function keepCreepAlive(creep) {
    if(Game.spawns["spn_main"].renewCreep(creep) == ERR_NOT_IN_RANGE) {
        creep.moveTo(Game.spawns["spn_main"]);
    }
    if(creep.ticksToLive > 1200) {
        creep.memory.recharging = false;
        creep.say("✓ Charged")
    }
}

function findDistance(p1, p2) {
    let xD = p2.x - p1.x;
    let yD = p2.y - p1.y;
    let vD = Math.sqrt((xD**2) + (yD**2));
    return vD;
}

