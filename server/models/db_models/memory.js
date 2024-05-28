import mongoose from "mongoose";
import { SectionType } from "../enums/enums";

const Schema = mongoose.Schema;

const MemorySchema = new Schema(
  {
    times: [{ type: String }],
    user: { type: Schema.Types.ObjectId, ref: "Users" },
    locations: [{ type: Schema.Types.ObjectId, ref: "Locations" }],
    sections: [
      {
        text: { type: String, default: "", required: true },
        sectionType: { type: String, enum: SectionType.listr() },
        people: [{ type: Schema.Types.ObjectId, ref: "People" }],
      },
    ],
    creationTime: { type: Date, required: true },
    modificationTime: { type: Date, required: true },
  },
  {
    collection: "memories",
  }
);

const db = mongoose.connection.useDb("reservior");
const Memory = db.model("Memories", MemorySchema);

export default Memory;
