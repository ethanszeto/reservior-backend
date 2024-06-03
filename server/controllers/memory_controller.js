import Authorize from "../auth/authorization.js";
import MemoryAccessor from "../db_accessors/memory.js";
import PeopleAccessor from "../db_accessors/people.js";
import LocationAccessor from "../db_accessors/location.js";
import mongoose from "mongoose";
import { MemoryCreate, MemoryCreateInternal, MemoryResponse } from "../models/api_models/memory.js";
import { ErrorInternalAPIModelValidation } from "../errors/internal_error.js";
import { ErrorValidation, ErrorUnexpected } from "../errors/http_error.js";
import UserAccessor from "../db_accessors/user.js";
import Connection from "../db/connection.js";

export default class MemoryController {
  /**
   *
   * @param {MemoryCreate} memoryCreate
   */
  static async convertMemoryToInternalMemory(memoryCreate) {
    // location names
    await Connection.open();
    const locationIds = await Promise.all(
      memoryCreate.locations.map(async (location) => {
        const dbLocation = await LocationAccessor.getLocationByUserAndLocationName(memoryCreate.user, location);
        return new mongoose.Types.ObjectId(dbLocation._id);
      })
    );

    memoryCreate.locations = locationIds;

    // people name
    const dbPeople = await PeopleAccessor.getPeopleByUser(memoryCreate.user);
    for (const section of memoryCreate.sections) {
      const peopleIds = section.people.map((personName) => {
        return dbPeople.find((dbPerson) => personName == dbPerson.name)._id;
      });
      section.people = peopleIds;
    }

    const dbUser = await UserAccessor.getUserByUsername(memoryCreate.user);
    memoryCreate.user = dbUser._id;

    return memoryCreate;
  }

  /**
   * Create memory
   *
   */
  static async createMemory(req, res) {
    try {
      const username = Authorize.getCurrentUser(req, res);
      req.body.user = username;

      const memoryCreate = new MemoryCreate(req.body);
      const memoryCreateIntermediary = await MemoryController.convertMemoryToInternalMemory(memoryCreate);
      const dbMemory = await MemoryAccessor.createMemory(memoryCreateIntermediary);
      const dbPopulatedMemory = await MemoryAccessor.getMemoryById(dbMemory._id);
      const memory = new MemoryResponse(dbPopulatedMemory.toObject());

      res.status(201).json(memory);
    } catch (e) {
      if (e instanceof ErrorInternalAPIModelValidation) {
        ErrorValidation.throwHttp(req, res, e.message);
      } else {
        ErrorUnexpected.throwHttp(req, res, e.message);
      }
    }
  }

  static async getMemoriesMe(req, res) {}
  static async updateMemoryById(req, res) {}
  static async getMemoriesMeByLocationId(req, res) {}
  static async getMemoriesMeByPerson(req, res) {}
  static async getFactsByPerson(req, res) {}
  static async getAnecdotesByPerson(req, res) {}
}
