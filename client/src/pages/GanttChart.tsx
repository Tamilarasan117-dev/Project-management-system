import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Gantt, ViewMode, type Task } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

type Tab = 'team' | 'individual';

const CustomTaskListHeader: React.FC<{ headerHeight: number; rowWidth: string; fontFamily: string; fontSize: string }> = ({ headerHeight, fontFamily, fontSize }) => {
  return (
    <div style={{ display: 'flex', height: headerHeight, fontFamily, fontSize, borderBottom: '1px solid #ebeff2', background: '#f8fafc', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
      <div style={{ flex: 1, minWidth: '150px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>Name</div>
      <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>From</div>
      <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>To</div>
      <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>Duration</div>
    </div>
  );
};

const CustomTaskListTable: React.FC<{
  rowHeight: number; rowWidth: string; fontFamily: string; fontSize: string; locale: string; tasks: Task[]; selectedTaskId: string; setSelectedTask: (taskId: string) => void; onExpanderClick: (task: Task) => void;
}> = ({ rowHeight, fontFamily, tasks, selectedTaskId, setSelectedTask, onExpanderClick }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {tasks.map(t => {
        const durationMs = t.end.getTime() - t.start.getTime();
        const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
        let expander = null;
        if (t.type === 'project' || t.type === 'milestone') {
          expander = (
            <span style={{ display: 'inline-block', width: '16px', fontSize: '10px', textAlign: 'center', cursor: 'pointer', marginRight: '4px' }} onClick={() => onExpanderClick(t)}>
              {t.hideChildren ? '▶' : '▼'}
            </span>
          );
        } else {
           expander = <span style={{ display: 'inline-block', width: '20px' }}></span>;
        }
        const paddingLeft = t.type === 'project' ? '10px' : t.type === 'milestone' ? '30px' : '50px';

        return (
          <div 
            key={t.id} 
            style={{ display: 'flex', height: rowHeight, fontFamily, borderBottom: '1px solid #ebeff2', background: t.id === selectedTaskId ? '#f3f4f6' : 'transparent', color: '#334155' }}
            onClick={() => setSelectedTask(t.id)}
          >
             <div style={{ flex: 1, minWidth: '150px', padding: '0 10px', paddingLeft, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
               {expander}
               <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }} title={t.name}>{t.name}</span>
             </div>
             <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>{t.start.toLocaleDateString('en-GB')}</div>
             <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>{t.end.toLocaleDateString('en-GB')}</div>
             <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 'bold' }}>{durationDays} d</div>
          </div>
        );
      })}
    </div>
  );
};

const CustomTooltip: React.FC<{ task: Task; fontSize: string; fontFamily: string }> = ({ task, fontSize, fontFamily }) => {
  const durationMs = task.end.getTime() - task.start.getTime();
  const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
  return (
    <div style={{ padding: '12px', background: 'white', border: `2px solid ${task.styles?.backgroundColor || '#e2e8f0'}`, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontFamily, fontSize }}>
      <b style={{ fontSize: '14px', display: 'block', marginBottom: '4px', color: task.styles?.backgroundColor || '#0f172a' }}>{task.name}</b>
      <div style={{ fontSize: '12px', color: '#64748b' }}>Start: {task.start.toLocaleDateString('en-GB')}</div>
      <div style={{ fontSize: '12px', color: '#64748b' }}>End: {task.end.toLocaleDateString('en-GB')}</div>
      <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px', color: task.styles?.backgroundColor || '#000' }}>
        Duration: {durationDays} Days
      </div>
    </div>
  );
};

export default function GanttChart() {
  const [activeTab, setActiveTab] = useState<Tab>('individual');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);

  const getProgress = (status: string) => {
    switch(status) {
      case 'Completed': return 100;
      case 'In Progress': return 50;
      case 'Started': return 20;
      case 'Blocked': return 10;
      case 'Not Started': default: return 0;
    }
  };

  const getSafeDates = (startStr: string, endStr: string) => {
    let start = new Date(startStr);
    let end = new Date(endStr);
    
    if (isNaN(start.getTime())) start = new Date();
    if (isNaN(end.getTime())) {
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    }
    
    // Ensure end is strictly after start for Gantt chart component to work properly
    if (end.getTime() <= start.getTime()) {
      end = new Date(start.getTime());
      end.setDate(end.getDate() + 1);
    }
    
    return { start, end };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, milestonesRes, tasksRes] = await Promise.all([
        supabase.from('projects').select('*').order('start_date', { ascending: true }),
        supabase.from('milestones').select('*').order('start_date', { ascending: true }),
        supabase.from('tasks').select('*').order('start_date', { ascending: true })
      ]);

      const projects = projectsRes.data || [];
      const milestones = milestonesRes.data || [];
      const tasksData = tasksRes.data || [];

      let formattedTasks: Task[] = [];
      let individualTasks: Task[] = [];

      projects.forEach((p) => {
        const pTasks = tasksData.filter(t => t.project_id === p.id);
        const internalTasks = pTasks.filter(t => t.type !== 'Team');
        const externalTasks = pTasks.filter(t => t.type === 'Team');

        const hasInternal = internalTasks.length > 0 || pTasks.length === 0;
        const hasExternal = externalTasks.length > 0 || pTasks.length === 0;

        const isProjectActual = !!(p.actual_start_date || p.actual_end_date);
        const { start: pStart, end: pEnd } = getSafeDates(
          p.actual_start_date || p.planned_start_date || p.start_date, 
          p.actual_end_date || p.planned_end_date || p.end_date
        );

        const projectTask: Task = {
          id: `p-${p.id}`,
          name: p.name,
          type: 'project',
          start: pStart,
          end: pEnd,
          progress: getProgress(p.status),
          isDisabled: true,
          hideChildren: false,
          styles: { 
            progressColor: isProjectActual ? '#1e3a8a' : '#3b82f6', 
            progressSelectedColor: isProjectActual ? '#1e3a8a' : '#2563eb',
            backgroundColor: isProjectActual ? '#1e40af' : undefined
          }
        };

        if (hasExternal) formattedTasks.push(projectTask);
        if (hasInternal) individualTasks.push(projectTask);

        const pMilestones = milestones.filter(m => m.project_id === p.id);
        pMilestones.forEach(m => {
          const mTasks = pTasks.filter(t => t.milestone_id === m.id);
          const mInternalTasks = mTasks.filter(t => t.type !== 'Team');
          const mExternalTasks = mTasks.filter(t => t.type === 'Team');

          const mHasInternal = mInternalTasks.length > 0 || mTasks.length === 0;
          const mHasExternal = mExternalTasks.length > 0 || mTasks.length === 0;

          if (!mHasInternal && !mHasExternal) return; // Should not happen based on logic above, but safe

          const isMilestoneActual = !!(m.actual_start_date || m.actual_end_date);
          const { start: mStart, end: mEnd } = getSafeDates(
            m.actual_start_date || m.planned_start_date || m.start_date, 
            m.actual_end_date || m.planned_end_date || m.end_date
          );

          const milestoneTask: Task = {
             id: `m-${m.id}`,
             name: m.name,
             type: 'milestone',
             start: mStart,
             end: mEnd,
             progress: getProgress(m.status),
             isDisabled: true,
             hideChildren: false,
             styles: { 
               progressColor: isMilestoneActual ? '#854d0e' : '#eab308', 
               progressSelectedColor: isMilestoneActual ? '#713f12' : '#ca8a04',
               backgroundColor: isMilestoneActual ? '#a16207' : undefined
             },
             project: `p-${p.id}`
          };

          if (hasExternal && mHasExternal) formattedTasks.push(milestoneTask);
          if (hasInternal && mHasInternal) individualTasks.push(milestoneTask);
        });

        pTasks.forEach(t => {
          const isTaskActual = !!(t.actual_start_date || t.actual_end_date);
          const { start: tStart, end: tEnd } = getSafeDates(
            t.actual_start_date || t.planned_start_date || t.start_date, 
            t.actual_end_date || t.planned_end_date || t.end_date
          );

          const taskObj: Task = {
             id: `t-${t.id}`,
             name: t.title,
             type: 'task',
             start: tStart,
             end: tEnd,
             progress: getProgress(t.status),
             isDisabled: true,
             styles: { 
               progressColor: isTaskActual ? '#14532d' : '#22c55e', 
               progressSelectedColor: isTaskActual ? '#14532d' : '#16a34a',
               backgroundColor: isTaskActual ? '#166534' : undefined
             },
             project: t.milestone_id ? `m-${t.milestone_id}` : `p-${p.id}`
          };
          
          if (t.type === 'Team') {
            if (hasExternal) formattedTasks.push(taskObj);
          } else {
            if (hasInternal) individualTasks.push(taskObj);
          }
        });
      });
      
      // Save all tasks in state, we'll filter them during render based on the active tab
      // However, project and milestone without tasks might look empty in individual, 
      // but the library handles it. We just store the two arrays.
      setTasks(activeTab === 'team' ? formattedTasks : individualTasks);
      
      // Store both so we don't have to refetch on tab switch
      // We can use a trick: save raw arrays or just refetch. Since it's fast, we can just refetch on tab change.
      // But better to save raw data in state:
    } catch (error) {
      console.error('Error fetching Gantt data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const subProjects = supabase.channel('gantt_projects').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchData).subscribe();
    const subMilestones = supabase.channel('gantt_milestones').on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, fetchData).subscribe();
    const subTasks = supabase.channel('gantt_tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData).subscribe();

    return () => {
      supabase.removeChannel(subProjects);
      supabase.removeChannel(subMilestones);
      supabase.removeChannel(subTasks);
    };
  }, [activeTab]);

  const handleExpanderClick = (task: Task) => {
    setTasks(tasks.map(t => (t.id === task.id ? task : t)));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex gap-4">
          <button
            className={`pb-2 ${activeTab === 'individual' ? 'font-bold text-primary border-b-2' : 'text-muted'}`}
            style={{ borderBottomColor: activeTab === 'individual' ? 'var(--primary)' : 'transparent', borderBottomStyle: 'solid', borderBottomWidth: '2px', paddingBottom: '0.5rem' }}
            onClick={() => setActiveTab('individual')}
          >
            Internal Team Gantt Chart
          </button>
          <button
            className={`pb-2 ${activeTab === 'team' ? 'font-bold text-primary border-b-2' : 'text-muted'}`}
            style={{ borderBottomColor: activeTab === 'team' ? 'var(--primary)' : 'transparent', borderBottomStyle: 'solid', borderBottomWidth: '2px', paddingBottom: '0.5rem' }}
            onClick={() => setActiveTab('team')}
          >
            External Team Gantt Chart
          </button>
        </div>
        
        <div className="flex gap-2">
          <button className={`btn btn-sm ${viewMode === ViewMode.Day ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode(ViewMode.Day)}>Day</button>
          <button className={`btn btn-sm ${viewMode === ViewMode.Week ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode(ViewMode.Week)}>Week</button>
          <button className={`btn btn-sm ${viewMode === ViewMode.Month ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode(ViewMode.Month)}>Month</button>
        </div>
      </div>

      <div className="card p-4 overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-muted-foreground">Loading Professional Gantt Chart...</div>
        ) : tasks.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <Gantt 
              tasks={tasks} 
              viewMode={viewMode}
              onExpanderClick={handleExpanderClick}
              listCellWidth="390px"
              columnWidth={viewMode === ViewMode.Month ? 150 : viewMode === ViewMode.Week ? 100 : 60}
              TaskListHeader={CustomTaskListHeader}
              TaskListTable={CustomTaskListTable}
              TooltipContent={CustomTooltip}
            />
          </div>
        ) : (
           <div className="p-8 text-center text-muted-foreground">No data available to display in Gantt Chart. Add a project to get started.</div>
        )}
      </div>
      
      <div className="flex flex-col gap-2 mt-2 text-sm text-muted">
        <div className="flex gap-4">
          <div className="font-medium mr-2">Planned:</div>
          <div className="flex items-center gap-2"><span style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></span> Project</div>
          <div className="flex items-center gap-2"><span style={{ width: '12px', height: '12px', backgroundColor: '#eab308', borderRadius: '2px' }}></span> Milestone</div>
          <div className="flex items-center gap-2"><span style={{ width: '12px', height: '12px', backgroundColor: '#22c55e', borderRadius: '2px' }}></span> Task</div>
        </div>
        <div className="flex gap-4">
          <div className="font-medium mr-2">Actual:</div>
          <div className="flex items-center gap-2"><span style={{ width: '12px', height: '12px', backgroundColor: '#1e40af', borderRadius: '2px' }}></span> Project</div>
          <div className="flex items-center gap-2"><span style={{ width: '12px', height: '12px', backgroundColor: '#a16207', borderRadius: '2px' }}></span> Milestone</div>
          <div className="flex items-center gap-2"><span style={{ width: '12px', height: '12px', backgroundColor: '#166534', borderRadius: '2px' }}></span> Task</div>
        </div>
      </div>
    </div>
  );
}