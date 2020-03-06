import { db } from "./firestore";
import users from "./users";
import say from "../say";
import strings from "./strings";
import activeFeatures from "./activeFeatures";

const commandsCollection = db.collection("commands");

let commandsMap = new Map();

let globalCooldown = new Map();

let cooldownMap = new Map();

export default {
  isEnabled(id) {
    return this.getCommand(id).enabled;
  },
  getCommand(id) {
    return commandsMap.get(id);
  },
  getCommandsMap() {
    return commandsMap;
  },
  /**
   * Checks if user has access to a command
   * @param {*} commandId The Id of the command
   * @param {*} displayName The displayName of the user using the command
   * @param {*} mod If the user is a mod
   * @param {*} sub If the user is a sub
   *
   * @returns An object that consist of "access"(boolean) and "message"(string or null)
   */
  auth(commandId, displayName, mod, sub, msgId) {
    let command = this.getCommand(commandId);
    if (!command) {
      return { access: true };
    }
    let auth = {
      access: false,
      message: null
    };
    if (!command.enabled) {
      return auth;
    }

    if ((mod || displayName === "ilikekitties") && command.modsOnly) {
      auth.access = true;
    } else if (sub && command.subsOnly) {
      auth.access = true;
    } else if (!command.subsOnly && !command.modsOnly) {
      auth.access = true;
    } else {
      auth.access = false;
      if (command.modsOnly) {
        users.deleteMessage(msgId);
      }
    }

    if (auth.access) {
      if (command.globalCooldown) {
        const last = globalCooldown.get(commandId);
        if (Date.now() - last < command.globalCooldown * 1000) {
          users.deleteMessage(msgId);
          return {access: false};
        } else {
          globalCooldown.set(commandId, Date.now());
        }
      }

      let cooldown = cooldownMap.get(displayName);
      if (cooldown) {
        if (command.cooldown && cooldown[commandId]) {
          const last = cooldown[commandId].last;
          if (Date.now() - last < command.cooldown * 1000) {
            auth.access = false;
            if (cooldown[commandId].warning) {
              users.timeout(
                displayName,
                command.cooldown,
                `You are using the "${commandId}" command too often."`
              );
              cooldown[commandId] = null;
              console.log("timed out");
            } else {
              auth.message = `@${displayName} The "${commandId}" command has a cooldown of ${command.cooldown} seconds. Please dont use it too often. [Warning]`;
              cooldown[commandId] = {
                last: last,
                warning: true
              };
            }
          }
        } else {
          cooldown[commandId] = {
            last: Date.now(),
            warning: false
          };
        }
      } else {
        cooldown = {};
        cooldown[commandId] = {
          last: Date.now(),
          warning: false
        };
      }
      if (command.cooldown) {
        cooldownMap.set(displayName, cooldown);
      }
    } else {
      if (command.subsOnly)
        auth.message = `@${displayName} The "${commandId}" command is only for subs`;
      if (command.modsOnly)
        auth.message = `@${displayName} The "${commandId}" command is only for mods`;
    }
    return auth;
  },
  enableCommand(displayName, commandId) {
    if (commandId) {
      commandId = strings.removeFirstSymbol(commandId.toLowerCase(), "!");
      const command = this.getCommand(commandId);
      if (command) {
        if (command.enabled) {
          return `@${displayName} The "${commandId}" command is already enabled"`;
        }
        if (commandId === "disable" || commandId === "enable") {
          return `@${displayName} You cannot enable the "${commandId}" command for obvious reasons.`;
        }
        if (command) {
          commandsCollection.doc(commandId).update({ enabled: true });
          return `The "${commandId}" command is now enabled`;
        } else {
          return `@${displayName} The command ${commandId} does not exist`;
        }
      } else {
        return `@${displayName} The command ${commandId} does not exist`;
      }
    } else {
      return `@${displayName} You need to supply which command to enable. For example "!enable dice"`;
    }
  },
  disableCommand(displayName, commandId) {
    if (commandId) {
      commandId = strings.removeFirstSymbol(commandId.toLowerCase(), "!");
      const command = this.getCommand(commandId);
      if (command) {
        if (!command.enabled) {
          return `@${displayName} The "${commandId}" command is already enabled"`;
        }
        if (commandId === "disable" || commandId === "enable") {
          return `@${displayName} You cannot disable the "${commandId}" command for obvious reasons.`;
        }
        if (this.getCommand(commandId)) {
          commandsCollection.doc(commandId).update({ enabled: false });
          return `The "${commandId}" command is now disabled`;
        } else {
          return `@${displayName} The command ${commandId} does not exist`;
        }
      } else {
        return `@${displayName} The command ${commandId} does not exist`;
      }
    } else {
      return `@${displayName} You need to supply which command to disable. For example "!disable dice"`;
    }
  },
  getCommands() {
    let output = "The currently available commands are: ";
    let first = true;
    let subsOnly = [];
    let normal = [];
    commandsMap.forEach((value, key) => {
      if (value.enabled && !value.invisible && !value.modsOnly) {
        if (value.subsOnly) subsOnly.push(key);
        else normal.push(key);
      }
    });

    normal.forEach(value => {
      output += `${first ? "" : ","} !${value}`;
      first = false;
    });
    first = true;

    if (subsOnly.length > 0) {
      output += ". For Subs only: ";
      subsOnly.forEach(value => {
        output += `${first ? "" : ","} !${value}`;
        first = false;
      });
    }

    return output;
  },
  getStaticCommand(commandName) {
    const name = strings.removeFirstSymbol(commandName, "!");
    const command = this.getCommand(name);
    if (command) {
      if (command.custom === false) {
        return command;
      } else {
        return null;
      }
    } else {
      return null;
    }
  },
  setCooldown(commandId, duration) {
    if (commandId && duration) {
      commandId = commandId.trim();
      duration = parseInt(duration.trim());
    }

    if (typeof duration === "number") {
      commandsCollection.doc(commandId).update({ cooldown: duration });
      return `Cooldown for ${commandId} is now ${duration}`;
    } else {
      return `You need to supply command-name and duration. For example !setcooldown dice 120`;
    }
  },
  updateCommands(type, tell = false) {
    setTimeout(() => {
      if (activeFeatures.isEnabled("autoToggle")) {
        commandsMap.forEach((value, key) => {
          if (value.availableTypes) {
            if (value.availableTypes.length > 0) {
              if (value.availableTypes.includes(type)) {
                this.enableCommand("Auto", key);
              } else {
                this.disableCommand("Auto", key);
              }
            }
          }
        });
        if (tell) {
          console.log("Telling chat");
          say(
            "rendogtv",
            `We are now playing ${type} and my available commands have updated. Use !commands to get available commands.`
          );
        }
      }
    }, 2000);
  },
  restartListner() {
    if (listner) {
      listner();
      startListner();
      return "I have restarted command- and features-listening";
    }
  }
};

let listner;

function startListner() {
  console.log("Starting command listner in commands");
  listner = commandsCollection.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(value => {
      const data = value.doc.data();
      const object = {
        enabled: data.enabled,
        availableTypes: data.availableTypes,
        invisible: data.invisible,
        displayName: data.displayName,
        response: data.response,
        cooldown: data.cooldown,
        globalCooldown: data.globalCooldown,
        modsOnly: data.modsOnly,
        subsOnly: data.subsOnly,
        custom: data.custom
      };
      const id = value.doc.id;
      switch (value.type) {
        case "added":
        case "modified":
          commandsMap.set(id, object);
          break;

        case "removed":
          commandsMap.delete(id);
          break;

        default:
          break;
      }
    });
  });
}

startListner();
