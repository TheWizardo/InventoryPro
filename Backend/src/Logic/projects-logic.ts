import { IProductComponent } from "../Models/InventoryItem-Model";
import Project, { IProject } from "../Models/Project-Model";
import { Types } from "mongoose";
import assemblyLogic from "./assembly-logic";
import { IAssembledItem } from "../Models/Assembly-Model";
import inventoryItemLogic from "./inventoryItem-logic";

async function populateProject(project: IProject): Promise<IProject> {
  // Populate components one level
  await project.populate({ path: "products.item", model: "InventoryItem" });

  return project;
}

export async function addProject(
  projectData: Partial<IProject>
): Promise<IProject> {
  const project = new Project(projectData);
  return await populateProject(await project.save());
}

export async function getAllProjects(): Promise<IProject[]> {
  const projects = await Project.find();
  await Promise.all(projects.map((p) => populateProject(p)));
  return projects;
}

export async function getProjectById(id: string): Promise<IProject | null> {
  if (!Types.ObjectId.isValid(id)) throw new Error("Invalid project ID");
  return await populateProject(await Project.findById(id));
}

export async function updateProject(
  id: string,
  updateData: Partial<IProject>
): Promise<IProject | null> {
  if (!Types.ObjectId.isValid(id)) throw new Error("Invalid project ID");
  return await populateProject(
    await Project.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
  );
}

export async function getProjectProductsProgress(id: string | Types.ObjectId): Promise<IProductComponent[]> {
  const project = await this.getProjectById(id) as IProject;
  const projectAssemblies = await assemblyLogic.getAssembliesByProject(id) as IAssembledItem[];
  const projectPtogress = await Promise.all(
    project.products.map(async (p) => (
      {
        item: await inventoryItemLogic.getInventoryItemById(p.item as Types.ObjectId),
        quantity: projectAssemblies.filter(a => a.item._id.toString() === p.item._id.toString()).length
      }
    )
    )
  )
  return projectPtogress;
} 
