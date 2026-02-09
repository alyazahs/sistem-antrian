import { useEffect, useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { Avatar } from 'primereact/avatar';

export default function Headbar({ title }) {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const options = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    setDateStr(now.toLocaleDateString('id-ID', options));
  }, []);

  const left = (
    <div className="flex flex-col mt-1">
      <h3 className="m-0 text-lg font-bold">{title}</h3>
      <span className="text-sm text-gray-500">{dateStr}</span>
    </div>
  );
  const right = (
    <div className="flex items-center gap-2">
      <Avatar image="https://i.pravatar.cc/40?img=12" shape="circle" className="w-[38px] h-[38px]" />
      <div className="text-right">
        <strong className="block text-base">Admin Pelayanan</strong>
        <small className="block text-xs text-gray-500">Kecamatan Jiwan</small>
      </div>
    </div>
  );
  return (
    <div className="bg-[#D9F1ED] px-7 py-5 shadow-md flex justify-between items-center relative z-50">
      <Toolbar left={left} right={right} className="w-full bg-transparent border-none shadow-none" />
    </div>
  );
}