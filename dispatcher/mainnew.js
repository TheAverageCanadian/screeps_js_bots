module.exports.loop = function () { //TODO idea: work manager that globally looks at all creeps and assigns them a task to stick to, such as mining a particular source or carrying to/from a particular harvester/container
    // SCAN FOR STUFF
    if(Game.creeps["taskmaster"] == null) {
        Game.spawns["spn_main"].spawnCreep([MOVE, MOVE, MOVE], "taskmaster", {directions: [TOP, TOP], memory: {jobsites: [], job: "TASKMASTER"}}); // spawn a taskmaster if none exists
    }
    let taskmaster = Game.creeps["taskmaster"];
    let sources = taskmaster.room.find(FIND_SOURCES_ACTIVE);
    let avCreeps = findAvailableCreeps();

    for(let s in sources) {
        generateJobsite(taskmaster, "MINE", s.x, s.y);
    }
    generateJobsite(taskmaster, "RECHARGE", Game.spawns["spn_main"].x, Game.spawns["spn_main"].y); // recharge jobsite always relevant
    let rechargeIndex = taskmaster.memory.jobsites.findIndex((j) => {j.job == "RECHARGE"}); // TODO: might not work the way I expect
    console.log("recharge job index is " + rechargeIndex);
    for(let c in Game.creeps) {
        if(c.ticksToLive < 250) {
            assignToJobsite(taskmaster, c, rechargeIndex);
        }
        if(c.hits < c.hitsMax) {
            
        }
    }





    //UNASSIGN CREEPS FROM COMPLETED/UNNEEDED TASKS



    //GENERATE NEW TASKS



    //ASSIGN CREEPS TO TASKS
    for(let a in avCreeps) {
        if(a.memory.model == "GENERAL") {
            a.memory.job = "MINE";
            a.memory.task = "";
            avCreeps = findAvailableCreeps();
            break;
        }
    }



    //EXECUTE ASSIGNED TASKS
}

function assignToJobsite(tm, creep, jobIndex) { // TODO: test this, probably won't work the way I expect
    let alreadyAssigned = false;
    for(let c in tm.memory.jobsites[jobIndex].assignedCreeps) {
        if(c == creep.name) {
            alreadyAssigned = true;
            break;
        }
    }
    if(!alreadyAssigned) {
        tm.memory.jobsites[jobIndex].assignedCreeps.push(creep.name);
       return true;
    } else {
        return false;
    }
    
}

function generateJobsite(tm, job, x, y) {
    let siteFound = false;
    for(let j in tm.memory.jobsites) {
        if(j.x == x && j.y == y && j.job == job) {
            siteFound = true;
            break;
        }
    }
    if(!siteFound) {
       tm.memory.jobsites.push({job: job, x: x, y: y, assignedCreeps: []});
       return true;
    } else {
        return false;
    }
}

function removeJobSite(tm, job, x, y) {

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
        if(c.memory.task == null) {
            avCreeps.push(c); // Add available creeps to list
        }
    }
    return avCreeps;
}