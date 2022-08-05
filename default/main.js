let role_harvester = require("role_harvester");
let role_upgrader = require("role_upgrader");
let role_builder = require("role_builder");
let role_hunter = require("role_hunter");
let role_carrier = require("role_carrier");

module.exports.loop = function () { //TODO idea: work manager that globally looks at all creeps and assigns them a task to stick to, such as mining a particular source or carrying to/from a particular harvester/container
    let harvester_count = 0;
    let upgrader_count = 0;
    let builder_count = 0;
    let hunter_count = 0;
    let carrier_count = 0;
    let creep_charging = false;
    for(let name in Game.creeps) { 
        let creep = Game.creeps[name];                      // Loop thru all creeps
        if (creep.ticksToLive <= 250) {                     // Renew life of expiring creeps
            creep.memory.recharging = true;
            creep_charging = true;
            creep.say("🔋")
        } 
        if(creep.memory.recharging) {   
            keepCreepAlive(creep);
            creep_charging = true;
        } else {                                                   
            switch(creep.memory.role) {                         // Perform role-specific actions
                case "harvester":
                    harvester_count++;
                    role_harvester.run(creep);
                    break;
                case "upgrader":
                    upgrader_count++;
                    role_upgrader.run(creep);
                    break;
                case "builder":
                    builder_count++;
                    role_builder.run(creep);
                    break;
                case "hunter":
                    hunter_count++;
                    role_hunter.run(creep);
                    break;
                case "carrier":
                    carrier_count++;
                    role_carrier.run(creep);
                    break;
            }
        }
    } // END CREEP FOR LOOP
    
    if(!creep_charging) {
        if(harvester_count < 3) {           // Restocking each creep
            let tmpName = "Hsvt" + Game.time;
            if(Game.spawns["spn_main"].spawnCreep([WORK,WORK,MOVE,MOVE], (tmpName), {memory: {role: "harvester", paired_crry: ""}}) == OK) {
                console.log("Harvester " + tmpName + " spawning");
            }
        } else if(carrier_count < 3) {
            let tmpName = "Crry" + Game.time;
            if(Game.spawns["spn_main"].spawnCreep([CARRY, CARRY, CARRY, MOVE, MOVE,], (tmpName), {memory: {role: "carrier", paired_harv: ""}}) == OK) {
                console.log("Carrier " + tmpName + " spawning");
            }
        } else if(upgrader_count < 3) {
            let tmpName = "Upgd" + Game.time;
            if(Game.spawns["spn_main"].spawnCreep([WORK,CARRY,MOVE], (tmpName), {memory: {role: "upgrader", upgrading: false}}) == OK) {
                console.log("Upgrader " + tmpName + " spawning");
            }
        } else if(builder_count < 3) {
            let tmpName = "Bldr" + Game.time;
            if(Game.spawns["spn_main"].spawnCreep([WORK,CARRY,MOVE], (tmpName), {memory: {role: "builder", building: false}}) == OK) {
                console.log("Builder " + tmpName + "spawning");
            }
        } else if(hunter_count < 5) {
            let tmpName = "Hntr" + Game.time;
            if(Game.spawns["spn_main"].spawnCreep([ATTACK, ATTACK, MOVE, MOVE, TOUGH, TOUGH], (tmpName), {directions: [TOP, TOP, TOP], memory: {role: "hunter"}}) == OK) {
                console.log("Hunter " + tmpName + "spawned");
            }
        }
    }
}

function keepCreepAlive(creep) {
    if(Game.spawns["spn_main"].renewCreep(creep) != OK) {
        console.log(Game.spawns["spn_main"].renewCreep(creep));
        creep.moveTo(Game.spawns["spn_main"]);
    }
    if(creep.ticksToLive > 1200) {
        creep.memory.recharging = false;
        creep.say("✓")
    }
}

function findDistance(p1, p2) {
    let xD = p2.x - p1.x;
    let yD = p2.y - p1.y;
    let vD = Math.sqrt((xD**2) + (yD**2));
    return vD;
}

