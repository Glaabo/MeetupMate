'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { DateSelectArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface User {
  name: string;
  events: EventInput[];
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([
    { name: 'User 1', events: [] },
    { name: 'User 2', events: [] },
  ]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [newUserName, setNewUserName] = useState('');

  const handleSelect = (info: DateSelectArg) => {
    const newEvent: EventInput = {
      id: String(Date.now()),
      start: info.startStr,
      end: info.endStr,
      allDay: info.allDay,
      title: 'available',
    };
    setUsers((prev) =>
      prev.map((u, i) =>
        i === currentUserIndex ? { ...u, events: [...u.events, newEvent] } : u
      )
    );
  };

  const addUser = () => {
    if (newUserName.trim()) {
      setUsers([...users, { name: newUserName.trim(), events: [] }]);
      setCurrentUserIndex(users.length);
      setNewUserName('');
    }
  };

  const commonEvents = computeCommonEvents(users.map((u) => u.events));

  return (
    <main className="flex flex-col gap-8 p-8">
      <h1 className="text-2xl font-bold">MeetupMate</h1>
      <div className="flex gap-2 items-center">
        <select
          className="border rounded p-1"
          value={currentUserIndex}
          onChange={(e) => setCurrentUserIndex(Number(e.target.value))}
        >
          {users.map((user, idx) => (
            <option key={idx} value={idx}>
              {user.name}
            </option>
          ))}
        </select>
        <input
          className="border rounded p-1"
          type="text"
          placeholder="Add participant"
          value={newUserName}
          onChange={(e) => setNewUserName(e.target.value)}
        />
        <button className="border rounded px-2 py-1" onClick={addUser}>
          Add
        </button>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        selectable
        select={handleSelect}
        events={users[currentUserIndex].events}
        height="auto"
      />
      <h2 className="text-xl font-semibold mt-4">Common availability</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="timeGridWeek"
        events={commonEvents}
        height="auto"
      />
    </main>
  );
}

function computeCommonEvents(usersEvents: EventInput[][]): EventInput[] {
  if (usersEvents.length === 0) return [];
  let intersection = usersEvents[0];
  for (let i = 1; i < usersEvents.length; i++) {
    const next: EventInput[] = [];
    intersection.forEach((a) => {
      usersEvents[i].forEach((b) => {
        const start = new Date(
          Math.max(Date.parse(a.start as string), Date.parse(b.start as string))
        );
        const end = new Date(
          Math.min(Date.parse(a.end as string), Date.parse(b.end as string))
        );
        if (start < end) {
          next.push({
            id: `${a.id}-${b.id}`,
            title: 'available',
            start: start.toISOString(),
            end: end.toISOString(),
          });
        }
      });
    });
    intersection = next;
    if (intersection.length === 0) break;
  }
  return intersection;
}
