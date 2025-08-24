import Project, { IProject } from "../Models/Project-Model";
import { Types } from "mongoose";

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
