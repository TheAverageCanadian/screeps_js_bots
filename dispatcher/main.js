const _ = require("lodash");

/* List of jobs:
 * MINE, RECHARGE, STORE, BUILD, FIX, UPGRADE
 *
 * 
 * TODO: Code for each individual job, test harvesting and storing
*/
module.exports.loop = function () {
    // SCAN FOR STUFF & GENERATE NEW TASKS
    if(Game.creeps["taskmaster"] == null) {
        Game.spawns["spn_main"].spawnCreep([MOVE], "taskmaster", {memory: {jobsites: {}, job: "TASKMASTER", phase: 1}}); // spawn a taskmaster if none exists
    } else {
        // Needed vars
        let taskmaster = Game.creeps["taskmaster"];
        let sources = taskmaster.room.find(FIND_SOURCES_ACTIVE);
        let avCreeps = findAvailableCreeps();
        let structs = taskmaster.room.find(FIND_STRUCTURES);
        let dSources = taskmaster.room.find(FIND_DROPPED_RESOURCES);
        let controller = _.filter( structs, function(s) { return (s.structureType == STRUCTURE_CONTROLLER); })[0];
        let siteCap = 1; // variable so that in later phases it can be changed

        // Constant jobsites
        let rechargeIndex = generateJobsite(taskmaster, "RECHARGE", Game.spawns["spn_main"].pos.x, Game.spawns["spn_main"].pos.y, 99);
        let upgradeIndex = generateJobsite(taskmaster, "UPGRADE", controller.pos.x, controller.pos.y, 2);


        //UNASSIGN CREEPS FROM COMPLETED/UNNEEDED TASKS
        // TODO: figure out how the shit to do this...
        // Loop thru all jobsites, if a relevant object/structure no longer exists there, delete it?
        for(let j in taskmaster.memory.jobsites) {
            let site = taskmaster.memory.jobsites[j];
            switch(site.job) {
                case "MINE":
                    if(taskmaster.room.lookForAt(LOOK_SOURCES, site.x, site.y) == null) {
                        for(let c in site.assignedCreeps) {
                            Game.creeps[c].job = "IDLE";
                            Game.creeps[c].jobSite = -1;
                        }
                        removeJobSiteByID(j);
                    }
                    break;
                case "STORE":
                    if(taskmaster.room.lookForAt(LOOK_RESOURCES, site.x, site.y) == null) {
                        for(let c in site.assignedCreeps) {
                            Game.creeps[c].job = "IDLE";
                            Game.creeps[c].jobSite = -1;
                        }
                        removeJobSiteByID(j);
                    }
                    break;
                case "FIX":
                    let st = taskmaster.room.lookForAt(LOOK_STRUCTURES, site.x, site.y);
                    if(st.hits == st.hitsMax) {
                        for(let c in site.assignedCreeps) {
                            Game.creeps[c].job = "IDLE";
                            Game.creeps[c].jobSite = -1;
                        }
                        removeJobSiteByID(j);
                    }
                    break;
                case "BUILD":
                    if(taskmaster.room.lookForAt(LOOK_CONSTRUCTION_SITES, site.x, site.y) == null) {
                        for(let c in site.assignedCreeps) {
                            Game.creeps[c].job = "IDLE";
                            Game.creeps[c].jobSite = -1;
                        }
                        removeJobSiteByID(j);
                    }
                    break;
                case "RECHARGE":
                    for(let c in site.assignedCreeps) {
                        let cr = Game.creeps[c];
                        if (cr.ticksToLive > 1000) {
                            cr.job = "IDLE";
                            cr.jobSite = -1;
                        }
                    }
                    break;
            }
        }

        //Mining all sources
        for(let s in sources) {
            generateJobsite(taskmaster, "MINE", sources[s].pos.x, sources[s].pos.y, siteCap);
        }

        // Dropped resource collection
        for(let s in dSources) {
            generateJobsite(taskmaster, "STORE", dSources[s].pos.x, dSources[s].pos.y, siteCap);
        }

        // Repairs
        for(let s in structs)
        {
            if(s.hits < s.hitsMax) {
                generateJobsite(taskmaster, "FIX", structs[s].pos.x, structs[s].pos.y, siteCap);
            }
        }

        //ASSIGN CREEPS TO TASKS
        let w;
        for(let j in taskmaster.memory.jobsites) {
            site = taskmaster.memory.jobsites[j];
            if(site != null) {
                if(site.assignedCreeps.length < site.cap) {
                    switch(site.job) {
                        case "MINE":
                            w = findWorker(avCreeps, "MINER", "IDLE");
                            //if(w == "NONE") {w = findWorker(avCreeps, "GENERAL", "IDLE");}
                            if(w == "NONE") {break;}
                            assignToJobsite(taskmaster, Game.creeps[w], j, "MINE");
                            break;
                        case "STORE":
                            w = findWorker(avCreeps, "MULE", "IDLE");
                            //if(w == "NONE") {w = findWorker(avCreeps, "GENERAL", "IDLE");}
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
                } else {/*console.log("site #" + j + " is full.")*/}
            } else {console.log("sites was null!");}
        avCreeps = findAvailableCreeps(); // Re-generate the list of available creeps so they don't get reused
        }

        for(let c in Game.creeps) {
            if(c.ticksToLive < 250) {
                assignToJobsite(taskmaster, c, rechargeIndex); // recharge creeps that are getting close to expiring
            }
            if(c.hits < c.hitsMax) {
                //TODO: heal the creep
            }
        }



        //EXECUTE ASSIGNED TASKS
        // site == {job:string, x:int, y:int, assignedCreeps: [string]}
        for(let s in taskmaster.memory.jobsites) {
            let site = taskmaster.memory.jobsites[s];
            switch(site.job) {
                case "MINE":
                    for(let name in site.assignedCreeps) {
                        c = Game.creeps[site.assignedCreeps[name]];
                        // TODO add a function or etc here to handle mining code
                        if( c.harvest( c.room.lookForAt(LOOK_SOURCES, site.x, site.y)[0] ) == ERR_NOT_IN_RANGE) {
                            c.moveTo(site.x, site.y);
                        }
                    }
                    break;
                case "STORE":
                    for(let name in site.assignedCreeps) {
                        c = Game.creeps[site.assignedCreeps[name]];
                        // TODO add a function or etc here to handle storage code
                        if( c.pickup( c.room.lookForAt(LOOK_RESOURCES, site.x, site.y)[0] ) == ERR_NOT_IN_RANGE) {
                            c.moveTo(site.x, site.y);
                        }
                    }
                    break;
            }
        }



        //RESTOCK CREEPS - GENERAL, MINER, MULE, HUNTER
        if(Game.creeps["taskmaster"] != null) {
            let creepQuota = defineQuota(taskmaster);
            let creepCount = countCreeps();
                
            //Spawn the creeps in priority order
            if(creepCount.gen < creepQuota.gen) {
                Game.spawns["spn_main"].spawnCreep([WORK, CARRY, MOVE], ("gen"+Game.time), {memory: {model: "GENERAL", job: "IDLE", jobSite: -1}});
            } else if(creepCount.min < creepQuota.min) {
                Game.spawns["spn_main"].spawnCreep([WORK, WORK, MOVE], ("mine"+Game.time), {memory: {model: "MINER", job: "IDLE", jobSite: -1}});
            } else if(creepCount.mul < creepQuota.mul) {
                Game.spawns["spn_main"].spawnCreep([CARRY, CARRY, CARRY, MOVE, MOVE], ("mule"+Game.time), {memory: {model: "MULE", job: "IDLE", jobSite: -1}});
            } else if(creepCount.hun < creepQuota.hun) {
                Game.spawns["spn_main"].spawnCreep([ATTACK, ATTACK, MOVE, MOVE, TOUGH, TOUGH, TOUGH, TOUGH], ("hunt"+Game.time), {memory: {model: "HUNTER", job: "IDLE", jobSite: -1}});
            }
        }
    }
}

function defineQuota(tm) {
    switch(tm.memory.phase) {
        case 1:
            return {gen:2, min:2, mul:2, hun:2};
    }
}

function countCreeps() {
    let count = {gen:0, min:0, mul:0, hun:0};
        for(c in Game.creeps) {
            switch(Game.creeps[c].memory.model) {
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

// finds a single creep of a certain model with a certain current job (usually IDLE)
function findWorker(creeps, model, job) { 
    for(c in creeps) {
        let cr = creeps[c];
        if(cr.memory.model == model && cr.memory.job == job) {
            return cr.name;
        }
    }
    return "NONE"; // returns if no creeps are found with a matching model and current job
}

// checks if a particular creep (object) is assigned to a particular jobsite (by ID), if not, adds it to that jobsite
function assignToJobsite(tm, creep, jobIndex, jobDesc) { // TODO: test this, probably won't work the way I expect
    let alreadyAssigned = false;
    for(let c in tm.memory.jobsites[jobIndex].assignedCreeps) {
        if(c == creep.name) { // loop thru all creeps assigned to this site, if this one is already assigned here then just return.
            alreadyAssigned = true;
            return false;
        }
    }
    if(!alreadyAssigned) { // redundant if block, but just to be safe
        tm.memory.jobsites[jobIndex].assignedCreeps.push(creep.name); // add the creep to the array of creeps on this jobsite
        creep.memory.job = jobDesc; // add the job's description to the creep for easy reference
        creep.memory.jobSite = jobIndex;
       return true; // return
    }
    return "error"; //WARN: This should never return
    
}

// removes a creep (by name) from the array of creeps assigned to a particular jobsite (by ID), and rebuilds the array to fill the empty gap.
function removeFromJobsite(tm, creepName, jobIndex) {
    let cIndex = 0; // index of creep to remove
    for(let n = 0; n < tm.memory.jobsites[jobIndex].assignedCreeps.length; n++) {
        if(tm.memory.jobsites[jobIndex].assignedCreeps[n] == creepName) {
            cIndex = n; // loop thru all creeps on this jobsite and if the name is the one to remove, store its index
        }
    }
    for(let i = 0; i < tm.memory.jobsites[jobIndex].assignedCreeps.length-1; i++) {
        if(i >= n) {
            tm.memory.jobsites[jobIndex].assignedCreeps[i] = tm.memory.jobsites[jobIndex].assignedCreeps[i+1];
        } // loop thru all creeps on this site and, starting with the creep to remove, shift all items in the array one spot left
            // this effectively overwrites the creep to remove and copies over the rest of the array one spot left
    }
    tm.memory.jobsites[jobIndex].assignedCreeps[tm.memory.jobsites[jobIndex].assignedCreeps.length-1] = null; // set the last item to null
}

// checks if a jobsite exists by descriptors, generates a new one if it doesn't, and returns its ID.
function generateJobsite(tm, job, x, y, cap) {
    let siteFound = false;
    // very low odds, but there is a slight chance this generates two jobs with the exact same random ID which would fuck everything up
    let id = Game.time + (Math.floor(Math.random() * (100000 - 0 + 1))+0); // generate a unique ID using game time plus a random int from 0 to 100,000
    for(let k in tm.memory.jobsites) { // make an array kvp for all jobsites
        //console.log(tm.memory.jobsites[k]);
        try {
            if(tm.memory.jobsites[k].x == x && tm.memory.jobsites[k].y == y && tm.memory.jobsites[k].job == job) {
                siteFound = true; // if the current site is identical to the one we want to create, just return its ID and don't make a duplicate.
                //console.log("site already found!")
                return k;
            }
        } catch(err) { /*site is probably null*/}
    }
    if(!siteFound) { // redundant if block, but just to be safe
        console.log("creating jobsite #"+ id + ": " + job + " @ " + x + ", " + y );
       tm.memory.jobsites[id] = {job: job, x: x, y: y, assignedCreeps: [], cap: cap};
       return id; // create a new jobsite using the unique ID with no creeps assigned using the provided information, and return its ID
    }
    return -1; //WARN: This should never return
}

// Sets a jobsite in Taskmaster to null by unique ID
function removeJobSiteByID(tm, jobID) {
    tm.memory.jobsites[jobID] == null; // a more efficent version of the below, assuming we know the job's ID. Just set it to null.
}

// sets a jobsite in Taskmaster to null by descriptors, works on first match.
function removeJobSite(tm, job, x, y) { // SLOWER/WORSE
    let sites = tm.memory.jobsites;
    for(let j = 0; j < sites.length; j++) { // loop through all jobsites
        if(sites[j].x == x && sites[j].y == y && sites[j].job == job) {
            tm.memory.jobsites[j] == null; // if the current site is identical to the one we want to delete, set it to null and return true
            return true;
        }
    }
    return false; // return false if unsuccessful
}

function keepCreepAlive(creep) { // TODO: update this, it's outdated
    if(Game.spawns["spn_main"].renewCreep(creep) == ERR_NOT_IN_RANGE) {
        creep.moveTo(Game.spawns["spn_main"]
        );
    }
    if(creep.ticksToLive > 1200) {
        creep.memory.recharging = false;
        creep.say("✓")
    }
}

// returns the distance in units as the crow flies between two points
function findDistance(p1, p2) {
    let xD = p2.x - p1.x;
    let yD = p2.y - p1.y;
    let vD = Math.sqrt((xD**2) + (yD**2));
    return vD; 
} 

// returns an array of all Creeps which are IDLE
function findAvailableCreeps() {
    let avCreeps = [];
    for(let c in Game.creeps) { //Loop over all creeps
        if(Game.creeps[c].memory.job == "IDLE") { // if the creep's current job is idle:
            avCreeps.push(Game.creeps[c]); // Add available creeps to list
        }
    }
    //console.log("available creeps: " + avCreeps);
    return avCreeps; // return that list
}