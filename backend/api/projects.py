"""
D365 Architect OS — Projects API
"""
from fastapi import APIRouter, HTTPException
from typing import List

from models.project import (
    Project, ProjectCreate, ProjectUpdate, RAIDItem, Decision, Assumption
)
from services import (
    list_projects, get_project, get_project_by_slug, create_project,
    update_project, delete_project, add_raid_item, add_decision, add_assumption
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=List[Project])
def get_projects():
    return list_projects()


@router.post("", response_model=Project)
def new_project(data: ProjectCreate):
    return create_project(data)


@router.get("/{project_id}", response_model=Project)
def get_project_detail(project_id: str):
    project = get_project(project_id)
    if not project:
        project = get_project_by_slug(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=Project)
def update_project_detail(project_id: str, data: ProjectUpdate):
    project = update_project(project_id, data)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}")
def remove_project(project_id: str):
    if not delete_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return {"success": True}


@router.post("/{project_id}/raid")
def add_raid(project_id: str, item: RAIDItem):
    project = add_raid_item(project_id, item)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return item


@router.post("/{project_id}/decisions")
def add_project_decision(project_id: str, decision: Decision):
    project = add_decision(project_id, decision)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return decision


@router.post("/{project_id}/assumptions")
def add_project_assumption(project_id: str, assumption: Assumption):
    project = add_assumption(project_id, assumption)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return assumption


@router.get("/{project_id}/artifacts")
def get_project_artifacts(project_id: str):
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.artifacts
