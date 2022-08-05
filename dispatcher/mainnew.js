const { assign, template } = require("lodash");

/* List of jobs:
 * MINE, RECHARGE, STORE, BUILD, FIX, UPGRADE
 *
*/
module.exports.loop = function () {
    // SCAN FOR STUFF & GENERATE NEW TASKS
    if(Game.creeps["taskmaster"] == null) {
        Game.spawns["spn_main"].spawnCreep([MOVE, MOVE, MOVE], "taskmaster", {directions: [TOP], memory: {jobsites: [], job: "TASKMASTER", phase: 1}}); // spawn a taskmaster if none exists
    }
    // Needed vars
    let taskmaster = Game.creeps["taskmaster"];
    let sources = taskmaster.room.find(FIND_SOURCES_ACTIVE);
    let avCreeps = findAvailableCreeps();
    let controller = taskmaster.pos.findClosestByPath(STRUCTURE_CONTROLLER);



    // Constant jobsites
    generateJobsite(taskmaster, "RECHARGE", Game.spawns["spn_main"].x, Game.spawns["spn_main"].y);
    generateJobsite(taskmaster, "UPGRADE", controller.pos.x, controller.pos.y);
    let rechargeIndex = taskmaster.memory.jobsites.findIndex((j) => {j.job == "RECHARGE"}); // TODO: might not work the way I expect


    // Loop thru creeps
    for(let c in Game.creeps) {
        if(c.ticksToLive < 250) {
            assignToJobsite(taskmaster, c, rechargeIndex);
        }
        if(c.hits < c.hitsMax) {
            //TODO: heal the creep
        }
    }

    //Mining all sources
    for(let s in sources) {
        generateJobsite(taskmaster, "MINE", s.x, s.y);
    }

    // Dropped resource collection
    sources = taskmaster.room.find(FIND_DROPPED_RESOURCES);
    for(let s in sources) {
        generateJobsite(taskmaster, "STORE", s.x, s.y);
    }

    // Repairs
    for(let s in taskmaster.room.find(FIND_STRUCTURES))
    {
        if(s.hits < s.hitsMax) {
            generateJobsite(taskmaster, "FIX", s.x, s.y);
        }
    }



    //UNASSIGN CREEPS FROM COMPLETED/UNNEEDED TASKS




    //ASSIGN CREEPS TO TASKS
    // recharge handled above
    let w;
    for(let j = 0; j < taskmaster.memory.jobsites.length(); j++) {
        site = taskmaster.memory.jobsites[j];
        switch(site.job) {
            case "MINE":
                w = findWorker(avCreeps, "MINER", "IDLE");
                if(w != "NONE") {w = findWorker(avCreeps, "GENERAL", "IDLE");}
                if(w == "NONE") {break;}
                assignToJobsite(taskmaster, Game.creeps[w], j, "MINE");
                break;
            case "STORE":
                w = findWorker(avCreeps, "MULE", "IDLE");
                if(w == "NONE") {w = findWorker(avCreeps, "GENERAL", "IDLE");}
                if(w == "NONE") {break;}
                assignToJobsite(taskmaster, Game.creeps[w], j, "STORE");
                break;
            case "UPGRADE":
                w = findWorker(avCreeps, "GENERAL", "IDLE");
                if(w == "NONE") {break;}
                assignToJobsite(taskmaster, Game.creeps[w], j, "UPGRADE");
                break;
            case "BUILD":
                w = findWorker(avCreeps, "GENERAL", "IDLE");
                if(w == "NONE") {break;}
                assignToJobsite(taskmaster, Game.creeps[w], j, "BUILD");
                break;
            case "FIX":
                w = findWorker(avCreeps, "GENERAL", "IDLE");
                if(w == "NONE") {break;}
                assignToJobsite(taskmaster, Game.creeps[w], j, "FIX");
                break;
        }
    avCreeps = findAvailableCreeps(); // Re-generate the list of available creeps so they don't get reused
    }



    //EXECUTE ASSIGNED TASKS
    // site == {job:string, x:int, y:int, assignedCreeps: [string]}
    for(let site in taskmaster.memory.jobsites) {
        switch(job) {
            case "MINE":
                for(let name in site.assignedCreeps) {
                    c = Game.creeps[name];
                    // TODO add a function or etc here to handle mining code
                    if( c.harvest( c.room.lookForAt(LOOK_SOURCES, site.x, site.y) ) == ERR_NOT_IN_RANGE) {
                        c.moveTo(site.x, site.y);
                    }
                }
                break;
            case "STORE":
                for(let name in site.assignedCreeps) {
                    c = Game.creeps[name];
                    // TODO add a function or etc here to handle storage code
                    if( c.pickup( c.room.lookForAt(LOOK_RESOURCES, site.x, site.y) ) == ERR_NOT_IN_RANGE) {
                        c.moveTo(site.x, site.y);
                    }
                }
                break;
        }
    }



    //RESTOCK CREEPS - GENERAL, MINER, MULE, HUNTER
    let creepQuota = () => {
        switch(taskmaster.memory.phase) {
            case 1:
                return {gen:2, min:2, mul:2, hun:2};
        }
    }
    let creepCount = () => {
        let count = {gen:0, min:0, mul:0, hun:0};
        for(c in Game.creeps) {
            switch(c.memory.model) {
                case "GENERAL":
                    count.gen++;
                    break;
                case "MINER":
                    count.min++;
                    break;
                case "MULE":
                    count.mul++;
                    break;
                case "HUNTER":
                    count.hun++;
                    break;
            }
        }
        return count;
    }
    //Spawn the creeps in priority order
    if(creepCount.gen < creepQuota.gen) {
        Game.spawns["spn_main"].spawnCreep([WORK, CARRY, MOVE], ("gen"+Game.time), {directions: [TOP], memory: {model: "GENERAL", job: "IDLE"}});
    } else if(creepCount.min < creepQuota.min) {
        Game.spawns["spn_main"].spawnCreep([WORK, WORK, MOVE], ("mine"+Game.time), {directions: [TOP], memory: {model: "GENERAL", job: "IDLE"}});
    } else if(creepCount.mul < creepQuota.mul) {
        Game.spawns["spn_main"].spawnCreep([CARRY, CARRY, CARRY, MOVE, MOVE], ("mule"+Game.time), {directions: [TOP], memory: {model: "GENERAL", job: "IDLE"}});
    } else if(creepCount.hun < creepQuota.hun) {
        Game.spawns["spn_main"].spawnCreep([ATTACK, ATTACK, MOVE, MOVE, TOUGH, TOUGH, TOUGH, TOUGH], ("hunt"+Game.time), {directions: [TOP], memory: {model: "GENERAL", job: "IDLE"}});
    }
}

function findWorker(creeps, model, job) {
    for(c in creeps) {
        if(c.memory.model == model && c.memory.job == job) {
            return c.name;
        }
    }
    return "NONE";
}

function assignToJobsite(tm, creep, jobIndex, jobDesc) { // TODO: test this, probably won't work the way I expect
    let alreadyAssigned = false;
    for(let c in tm.memory.jobsites[jobIndex].assignedCreeps) {
        if(c == creep.name) {
            alreadyAssigned = true;
            return false;
        }
    }
    if(!alreadyAssigned) {
        tm.memory.jobsites[jobIndex].assignedCreeps.push(creep.name);
        creep.memory.job = jobDesc;
       return true;
    }
    return "error"; //WARN: This should never return
    
}

function generateJobsite(tm, job, x, y) {
    let siteFound = false;
    for(let j in tm.memory.jobsites) {
        if(j.x == x && j.y == y && j.job == job) {
            siteFound = true;
            return false;
        }
    }
    if(!siteFound) {
       tm.memory.jobsites.push({job: job, x: x, y: y, assignedCreeps: []});
       return true;
    }
    return "error"; //WARN: This should never return
}

function removeJobSite(tm, job, x, y) {
    let sites = tm.memory.jobsites;
    for(let j = 0; j < sites.length; j++) {
        if(sites[j].x == x && sites[j].y == y && sites[j].job == job) {
            tm.memory.jobsites[j] == null;
            return true;
        }
    }
    return false;
}

function keepCreepAlive(creep) {
    if(Game.spawns["spn_main"].renewCreep(creep) == ERR_NOT_IN_RANGE) {
        creep.moveTo(Game.spawns["spn_main"]
        );
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

function findAvailableCreeps() {
    let avCreeps = [];
    for(let c in Game.creeps) { //Loop over all creeps
        if(c.memory.job == "IDLE") {
            avCreeps.push(c); // Add available creeps to list
        }
    }
    return avCreeps;
}