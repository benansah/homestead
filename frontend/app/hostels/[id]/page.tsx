'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import {
  MapPin, Star, ShieldCheck, Heart, Phone, Share2,
  ChevronLeft, ChevronRight, Bed, Users, Loader2, X, UserCheck,
  UsersRound, Copy, Check
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Hostel, Room, Review } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

const HostelMap = dynamic(() => import('../../../components/HostelMap'), {
  ssr: false,
  loading: () => <div className="h-72 rounded-2xl bg-gray-100 animate-pulse" />,
});

interface HostelDetail {
  hostel: Hostel;
  rooms: Room[];
  reviews: Review[];
}

export default function HostelDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData]           = useState<HostelDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [imgIndex, setImgIndex]   = useState(0);
  const [showAllImgs, setShowAllImgs] = useState(false);
  const [booking, setBooking]     = useState<Room | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Group booking state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupRoom, setGroupRoom]           = useState<Room | null>(null);
  const [maxMembers, setMaxMembers]         = useState(2);
  const [groupLoading, setGroupLoading]     = useState(false);
  const [groupCode, setGroupCode]           = useState<number | null>(null);
  const [codeCopied, setCodeCopied]         = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/hostels/${id}`);
        setData(res.data);
      } catch {
        toast.error('Failed to load hostel');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleGroupBook = async () => {
    if (!user) { toast.error('Please sign in'); router.push('/login'); return; }
    if (!groupRoom) return;
    try {
      setGroupLoading(true);
      const res = await api.post('/bookings/group', { room_id: groupRoom.id, max_members: maxMembers });
      setGroupCode(res.data.group_booking_id);
      if (res.data.payment_url) window.location.href = res.data.payment_url;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create group booking');
    } finally {
      setGroupLoading(false);
    }
  };

  const copyGroupCode = (code: number) => {
    navigator.clipboard.writeText(String(code));
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleBook = async (room: Room) => {
    if (!user) {
      toast.error('Please sign in to book');
      router.push('/login');
      return;
    }
    if (user.role !== 'student') {
      toast.error('Only students can book rooms');
      return;
    }
    try {
      setBookingLoading(true);
      const res = await api.post('/bookings', { room_id: room.id });
      toast.success('Booking initiated! Complete payment to confirm.');
      // redirect to Paystack payment URL
      if (res.data.payment_url) {
        window.location.href = res.data.payment_url;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
      setBooking(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="text-center py-24 text-gray-400">Hostel not found</div>
    </div>
  );

  const { hostel, rooms, reviews } = data;
  const allImages = hostel.images?.filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── PHOTO GALLERY — Zillow style grid ── */}
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-0">

        {allImages.length > 0 ? (
          <div className="relative rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 grid-rows-2 gap-1 h-72 md:h-96">
              {/* Main large image */}
              <div className="col-span-2 row-span-2 relative cursor-pointer"
                onClick={() => setShowAllImgs(true)}>
                <img src={allImages[0]} alt="Main"
                  className="w-full h-full object-cover hover:brightness-95 transition" />
              </div>
              {/* Side images */}
              {allImages.slice(1, 5).map((img, i) => (
                <div key={i} className="relative cursor-pointer"
                  onClick={() => { setImgIndex(i + 1); setShowAllImgs(true); }}>
                  <img src={img} alt={`Room ${i + 2}`}
                    className="w-full h-full object-cover hover:brightness-95 transition" />
                  {i === 3 && allImages.length > 5 && (
                    <div className="absolute inset-0 bg-black bg-opacity-40
                                    flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        +{allImages.length - 5} photos
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {/* Fill empty slots */}
              {Array.from({ length: Math.max(0, 4 - allImages.slice(1, 5).length) }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-gray-100" />
              ))}
            </div>

            {/* Show all photos button */}
            <button
              onClick={() => setShowAllImgs(true)}
              className="absolute bottom-4 right-4 bg-white text-sm font-semibold
                         px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              style={{ border: '1px solid var(--border)' }}>
              Show all photos
            </button>
          </div>
        ) : (
          <div className="h-72 rounded-2xl bg-gray-100 flex items-center justify-center">
            <span className="text-6xl opacity-20">🏠</span>
          </div>
        )}
      </div>

      {/* ── FULLSCREEN GALLERY MODAL ── */}
      {showAllImgs && allImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50
                        flex items-center justify-center">
          <button onClick={() => setShowAllImgs(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300">
            <X size={28} />
          </button>
          <button
            onClick={() => setImgIndex(i => Math.max(0, i - 1))}
            className="absolute left-4 text-white hover:text-gray-300 disabled:opacity-30"
            disabled={imgIndex === 0}>
            <ChevronLeft size={36} />
          </button>
          <img src={allImages[imgIndex]} alt="Gallery"
            className="max-h-screen max-w-5xl w-full object-contain px-16" />
          <button
            onClick={() => setImgIndex(i => Math.min(allImages.length - 1, i + 1))}
            className="absolute right-4 text-white hover:text-gray-300 disabled:opacity-30"
            disabled={imgIndex === allImages.length - 1}>
            <ChevronRight size={36} />
          </button>
          <div className="absolute bottom-4 text-white text-sm">
            {imgIndex + 1} / {allImages.length}
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-10">

          {/* ── LEFT — main info ── */}
          <div className="flex-1 min-w-0">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {hostel.is_verified && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
                      <ShieldCheck size={11} /> Verified
                    </span>
                  )}
                  <span className="text-xs text-gray-500 font-medium px-2 py-1
                                   rounded-full bg-gray-100">
                    Track {hostel.track}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {hostel.hostel_name}
                </h1>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin size={14} />
                  <span>{hostel.hostel_address}</span>
                  <span className="mx-1">·</span>
                  <span className="font-medium" style={{ color: 'var(--blue)' }}>
                    🎓 {hostel.university}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                                   font-medium text-gray-700 hover:bg-gray-50 border transition-colors"
                  style={{ borderColor: 'var(--border)' }}>
                  <Share2 size={15} /> Share
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                                   font-medium text-gray-700 hover:bg-gray-50 border transition-colors"
                  style={{ borderColor: 'var(--border)' }}>
                  <Heart size={15} /> Save
                </button>
              </div>
            </div>

            {/* Rating bar */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-5 pb-5"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <Star size={16} fill="#F59E0B" color="#F59E0B" />
                <span className="font-bold text-gray-900">
                  {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                </span>
                <span className="text-gray-500 text-sm">
                  · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Description */}
            {hostel.description && (
              <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-lg font-bold text-gray-900 mb-2">About this hostel</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{hostel.description}</p>
              </div>
            )}

            {/* Location map */}
            {hostel.latitude && hostel.longitude && (
              <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Location</h2>
                <HostelMap
                  lat={hostel.latitude}
                  lng={hostel.longitude}
                  name={hostel.hostel_name}
                  address={hostel.hostel_address}
                />
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <MapPin size={11} /> {hostel.hostel_address}
                </p>
              </div>
            )}

            {/* Rooms section */}
            <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Available rooms</h2>
              <div className="space-y-3">
                {rooms.map(room => (
                  <div key={room.id}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ border: '1px solid var(--border)' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--blue-light)' }}>
                        <Bed size={18} style={{ color: 'var(--blue)' }} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{room.room_type}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Users size={11} /> {room.gender_policy}
                          </span>
                          <span className="text-xs text-gray-500">
                            {room.quantity} unit{room.quantity !== 1 ? 's' : ''}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            room.is_available
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {room.is_available ? 'Available' : 'Full'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        GHS {Number(room.price).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mb-2">per year</p>
                      {room.is_available ? (
                        <div className="flex flex-col gap-1.5 items-end">
                          <button
                            onClick={() => handleBook(room)}
                            disabled={bookingLoading}
                            className="px-4 py-2 rounded-lg text-white text-xs font-semibold
                                       hover:opacity-90 transition-opacity disabled:opacity-50
                                       flex items-center gap-1"
                            style={{ background: 'var(--blue)' }}>
                            {bookingLoading ? <Loader2 size={11} className="animate-spin" /> : null}
                            Book now · GHS 50
                          </button>
                          <button
                            onClick={() => { setGroupRoom(room); setShowGroupModal(true); }}
                            className="px-4 py-2 rounded-lg text-xs font-semibold border
                                       hover:bg-gray-50 transition-colors flex items-center gap-1"
                            style={{ borderColor: 'var(--border)', color: 'var(--blue)' }}>
                            <UsersRound size={12} /> Book with friends
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not available</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Reviews ({reviews.length})
                </h2>
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="pb-4"
                      style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center
                                        text-white text-xs font-bold"
                          style={{ background: 'var(--blue)' }}>
                          {review.student_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {review.student_name}
                          </p>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={11}
                                fill={i < Math.round(review.rating) ? '#F59E0B' : 'none'}
                                color={i < Math.round(review.rating) ? '#F59E0B' : '#D1D5DB'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 leading-relaxed ml-10">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT — sticky booking card ── */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-20 rounded-2xl p-6 shadow-lg"
              style={{ border: '1px solid var(--border)' }}>

              {/* Price */}
              <div className="mb-4">
                <span className="text-2xl font-bold text-gray-900">
                  GHS {Number(rooms[0]?.price || 0).toLocaleString()}
                </span>
                <span className="text-gray-400 text-sm"> / year starting</span>
              </div>

              {/* Rating */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-1 text-sm mb-4 pb-4"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <span className="font-bold">
                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                  </span>
                  <span className="text-gray-500">· {reviews.length} reviews</span>
                </div>
              )}

              {/* Room picker */}
              <div className="space-y-2 mb-4">
                {rooms.filter(r => r.is_available).slice(0, 3).map(room => (
                  <button key={room.id}
                    onClick={() => setBooking(room)}
                    className="w-full flex items-center justify-between p-3 rounded-lg
                               border text-sm hover:border-blue-500 transition-colors text-left"
                    style={{ borderColor: booking?.id === room.id ? 'var(--blue)' : 'var(--border)',
                             background: booking?.id === room.id ? 'var(--blue-light)' : 'transparent' }}>
                    <span className="font-medium text-gray-800">{room.room_type}</span>
                    <span className="font-bold" style={{ color: 'var(--blue)' }}>
                      GHS {Number(room.price).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>

              {/* Viewing fee note */}
              <div className="rounded-lg p-3 mb-4 text-xs"
                style={{ background: '#FFF9EB', border: '1px solid #FDE68A' }}>
                <p className="font-semibold text-amber-800 mb-0.5">Viewing fee: GHS 50</p>
                <p className="text-amber-700">
                  Pay GHS 50 to get the landlord's contact and book a viewing.
                  Full refund if room is unavailable.
                </p>
              </div>

              {/* Book button */}
              <button
                disabled={!booking || bookingLoading}
                onClick={() => booking && handleBook(booking)}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm
                           hover:opacity-90 transition-opacity disabled:opacity-50
                           flex items-center justify-center gap-2"
                style={{ background: 'var(--blue)' }}>
                {bookingLoading && <Loader2 size={16} className="animate-spin" />}
                {booking ? `Book viewing · GHS 50` : 'Select a room'}
              </button>

              {/* Landlord contact — only after booking */}
              {hostel.landlord_phone && (
                <a href={`tel:${hostel.landlord_phone}`}
                  className="flex items-center justify-center gap-2 mt-3 py-3 rounded-xl
                             border text-sm font-semibold text-gray-700 hover:bg-gray-50
                             transition-colors"
                  style={{ borderColor: 'var(--border)' }}>
                  <Phone size={15} /> Call landlord
                </a>
              )}

              <p className="text-xs text-center text-gray-400 mt-3">
                You won't be charged until booking is confirmed
              </p>

              {/* Roommate matching */}
              {user?.role === 'student' && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Looking for a roommate?</p>
                  <Link href={`/roommates?hostel_id=${id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                               border text-sm font-semibold text-gray-700 hover:bg-gray-50
                               transition-colors"
                    style={{ borderColor: 'var(--border)' }}>
                    <UserCheck size={15} style={{ color: 'var(--blue)' }} />
                    Find a roommate here
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── GROUP BOOKING MODAL ── */}
      {showGroupModal && groupRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Book with friends</h2>
                <p className="text-xs text-gray-400 mt-0.5">{groupRoom.room_type} · GHS {Number(groupRoom.price).toLocaleString()}/yr</p>
              </div>
              <button onClick={() => { setShowGroupModal(false); setGroupCode(null); }}>
                <X size={20} className="text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            {groupCode ? (
              /* After creating — show group code */
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'var(--blue-light)' }}>
                  <UsersRound size={28} style={{ color: 'var(--blue)' }} />
                </div>
                <p className="font-bold text-gray-900 mb-1">Group booking created!</p>
                <p className="text-sm text-gray-500 mb-4">
                  Share this code with your friends so they can join and pay.
                </p>
                <div className="flex items-center justify-between gap-3 p-4 rounded-xl mb-4"
                  style={{ background: 'var(--blue-light)', border: '1px solid var(--blue)' }}>
                  <span className="text-2xl font-black tracking-widest" style={{ color: 'var(--blue)' }}>
                    #{groupCode}
                  </span>
                  <button
                    onClick={() => copyGroupCode(groupCode)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                               text-white hover:opacity-90"
                    style={{ background: 'var(--blue)' }}>
                    {codeCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Redirecting you to payment… each member pays GHS 50 individually.
                </p>
              </div>
            ) : (
              /* Setup form */
              <>
                <div className="rounded-xl p-4 mb-5"
                  style={{ background: '#F8F9FA', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold text-gray-500 mb-1">How it works</p>
                  <ol className="text-xs text-gray-600 space-y-1 list-decimal ml-4">
                    <li>You pay GHS 50 and get a group code</li>
                    <li>Share the code with your friends</li>
                    <li>Each friend enters the code and pays GHS 50</li>
                    <li>Admin releases the landlord contact to everyone</li>
                  </ol>
                </div>

                <div className="mb-5">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    How many people (including you)?
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map(n => (
                      <button key={n}
                        onClick={() => setMaxMembers(n)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all"
                        style={{
                          borderColor: maxMembers === n ? 'var(--blue)' : 'var(--border)',
                          background: maxMembers === n ? 'var(--blue-light)' : '#fff',
                          color: maxMembers === n ? 'var(--blue)' : '#374151',
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Total viewing fees: GHS {maxMembers * 50} ({maxMembers} × GHS 50)
                  </p>
                </div>

                <button
                  onClick={handleGroupBook}
                  disabled={groupLoading}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm
                             hover:opacity-90 transition-opacity disabled:opacity-50
                             flex items-center justify-center gap-2"
                  style={{ background: 'var(--blue)' }}>
                  {groupLoading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <UsersRound size={16} />}
                  Create group &amp; pay GHS 50
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MOBILE BOOK BAR ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white px-4 py-3 shadow-lg"
        style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900">
              GHS {Number(rooms[0]?.price || 0).toLocaleString()}
              <span className="font-normal text-gray-400 text-xs"> /yr</span>
            </p>
            <p className="text-xs text-gray-400">Viewing fee: GHS 50</p>
          </div>
          <button
            disabled={bookingLoading}
            onClick={() => {
              const firstAvailable = rooms.find(r => r.is_available);
              if (firstAvailable) handleBook(firstAvailable);
            }}
            className="px-6 py-3 rounded-xl text-white font-bold text-sm
                       hover:opacity-90 transition-opacity disabled:opacity-50
                       flex items-center gap-2"
            style={{ background: 'var(--blue)' }}>
            {bookingLoading && <Loader2 size={15} className="animate-spin" />}
            Book now
          </button>
        </div>
      </div>
    </div>
  );
}