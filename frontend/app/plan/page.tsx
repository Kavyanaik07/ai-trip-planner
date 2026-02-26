'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

function getLocalToday(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-')
}
const localToday = getLocalToday()
function addDays(d: string, n: number): string {
  const date = new Date(d + 'T00:00:00')
  date.setDate(date.getDate() + n)
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-')
}
function daysBetween(a: string, b: string): number {
  if (!a || !b) return 0
  return Math.ceil((new Date(b+'T00:00:00').getTime() - new Date(a+'T00:00:00').getTime()) / 86400000)
}

interface LocationData {
  flag: string
  img: string
  heroImg?: string // beautiful right-panel image
  states: Record<string, {
    img: string
    cities: { name: string; img: string }[]
  }>
}

// ─── EXPANDED LOCATION DB ────────────────────────────────────────────────────
const LOCATION_DB: Record<string, LocationData> = {
  India: {
    flag: '🇮🇳',
    img: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1400&q=90',
    states: {
      Karnataka: { img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1400&q=90', cities: [
        { name: 'Bangalore', img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1400&q=90' },
        { name: 'Mysore', img: 'https://images.unsplash.com/photo-1608848461950-0fe51dfc41cb?w=1400&q=90' },
        { name: 'Mangalore', img: 'https://images.unsplash.com/photo-1590050752117-7e285b5c5eca?w=1400&q=90' },
        { name: 'Hampi', img: 'https://images.unsplash.com/photo-1602642977157-bd13c8af09fa?w=1400&q=90' },
        { name: 'Coorg', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1400&q=90' },
        { name: 'Hubli', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1400&q=90' },
      ]},
      Goa: { img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1400&q=90', cities: [
        { name: 'Panaji', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1400&q=90' },
        { name: 'Calangute', img: 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=1400&q=90' },
        { name: 'Anjuna', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1400&q=90' },
        { name: 'Margao', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1400&q=90' },
        { name: 'Vasco da Gama', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1400&q=90' },
        { name: 'Ponda', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1400&q=90' },
      ]},
      Kerala: { img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1400&q=90', cities: [
        { name: 'Kochi', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1400&q=90' },
        { name: 'Thiruvananthapuram', img: 'https://images.unsplash.com/photo-1590050752117-7e285b5c5eca?w=1400&q=90' },
        { name: 'Alleppey', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Munnar', img: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1400&q=90' },
        { name: 'Kozhikode', img: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1400&q=90' },
        { name: 'Thrissur', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1400&q=90' },
        { name: 'Varkala', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Wayanad', img: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1400&q=90' },
      ]},
      Rajasthan: { img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1400&q=90', cities: [
        { name: 'Jaipur', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1400&q=90' },
        { name: 'Udaipur', img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1400&q=90' },
        { name: 'Jodhpur', img: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1400&q=90' },
        { name: 'Jaisalmer', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90' },
        { name: 'Pushkar', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1400&q=90' },
        { name: 'Ajmer', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1400&q=90' },
        { name: 'Mount Abu', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1400&q=90' },
      ]},
      'Jammu & Kashmir': { img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90', cities: [
        { name: 'Srinagar', img: 'https://images.unsplash.com/photo-1579531403069-7b1e4e0da2af?w=1400&q=90' },
        { name: 'Leh', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Gulmarg', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Pahalgam', img: 'https://images.unsplash.com/photo-1569610432461-ebcfb3c1a5a1?w=1400&q=90' },
        { name: 'Kargil', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Jammu', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
      ]},
      Maharashtra: { img: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=1400&q=90', cities: [
        { name: 'Mumbai', img: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=1400&q=90' },
        { name: 'Pune', img: 'https://images.unsplash.com/photo-1568157045741-5ef98f12cd64?w=1400&q=90' },
        { name: 'Aurangabad', img: 'https://images.unsplash.com/photo-1567591370920-1e3be671c8c2?w=1400&q=90' },
        { name: 'Lonavala', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1400&q=90' },
        { name: 'Nashik', img: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=1400&q=90' },
        { name: 'Nagpur', img: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=1400&q=90' },
        { name: 'Kolhapur', img: 'https://images.unsplash.com/photo-1568157045741-5ef98f12cd64?w=1400&q=90' },
      ]},
      'Tamil Nadu': { img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1400&q=90', cities: [
        { name: 'Chennai', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1400&q=90' },
        { name: 'Coimbatore', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1400&q=90' },
        { name: 'Madurai', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1400&q=90' },
        { name: 'Ooty', img: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1400&q=90' },
        { name: 'Kodaikanal', img: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1400&q=90' },
        { name: 'Rameswaram', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1400&q=90' },
      ]},
      'Uttar Pradesh': { img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1400&q=90', cities: [
        { name: 'Agra', img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1400&q=90' },
        { name: 'Varanasi', img: 'https://images.unsplash.com/photo-1561361058-c24e01770b3d?w=1400&q=90' },
        { name: 'Lucknow', img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1400&q=90' },
        { name: 'Mathura', img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1400&q=90' },
        { name: 'Vrindavan', img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1400&q=90' },
        { name: 'Allahabad', img: 'https://images.unsplash.com/photo-1561361058-c24e01770b3d?w=1400&q=90' },
      ]},
      'West Bengal': { img: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=1400&q=90', cities: [
        { name: 'Kolkata', img: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=1400&q=90' },
        { name: 'Darjeeling', img: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1400&q=90' },
        { name: 'Siliguri', img: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=1400&q=90' },
      ]},
      'Himachal Pradesh': { img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90', cities: [
        { name: 'Shimla', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Manali', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Dharamshala', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Kasol', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Spiti Valley', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
      ]},
      Uttarakhand: { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90', cities: [
        { name: 'Rishikesh', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90' },
        { name: 'Haridwar', img: 'https://images.unsplash.com/photo-1561361058-c24e01770b3d?w=1400&q=90' },
        { name: 'Dehradun', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Nainital', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Mussoorie', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
      ]},
    },
  },
  Japan: {
    flag: '🇯🇵',
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=90',
    states: {
      'Kantō (Tokyo)': { img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&q=90', cities: [
        { name: 'Tokyo', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&q=90' },
        { name: 'Yokohama', img: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=1400&q=90' },
        { name: 'Kamakura', img: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=1400&q=90' },
        { name: 'Nikko', img: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=1400&q=90' },
        { name: 'Hakone', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&q=90' },
      ]},
      Kansai: { img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=90', cities: [
        { name: 'Kyoto', img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=90' },
        { name: 'Osaka', img: 'https://images.unsplash.com/photo-1589452271712-64b8a66c7b71?w=1400&q=90' },
        { name: 'Nara', img: 'https://images.unsplash.com/photo-1589452271712-64b8a66c7b71?w=1400&q=90' },
        { name: 'Kobe', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&q=90' },
        { name: 'Hiroshima', img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=90' },
      ]},
      Hokkaido: { img: 'https://images.unsplash.com/photo-1547700055-b61cacebece9?w=1400&q=90', cities: [
        { name: 'Sapporo', img: 'https://images.unsplash.com/photo-1547700055-b61cacebece9?w=1400&q=90' },
        { name: 'Hakodate', img: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=1400&q=90' },
        { name: 'Furano', img: 'https://images.unsplash.com/photo-1547700055-b61cacebece9?w=1400&q=90' },
        { name: 'Niseko', img: 'https://images.unsplash.com/photo-1547700055-b61cacebece9?w=1400&q=90' },
      ]},
      Kyushu: { img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&q=90', cities: [
        { name: 'Fukuoka', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&q=90' },
        { name: 'Nagasaki', img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=90' },
        { name: 'Kumamoto', img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=90' },
        { name: 'Beppu', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&q=90' },
      ]},
      Okinawa: { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90', cities: [
        { name: 'Naha', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Ishigaki', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Miyako-jima', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
      ]},
    },
  },
  France: {
    flag: '🇫🇷',
    img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1400&q=90',
    states: {
      'Île-de-France': { img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1400&q=90', cities: [
        { name: 'Paris', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1400&q=90' },
        { name: 'Versailles', img: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=1400&q=90' },
        { name: 'Fontainebleau', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1400&q=90' },
      ]},
      "Provence-Alpes-Côte d'Azur": { img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90', cities: [
        { name: 'Nice', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90' },
        { name: 'Marseille', img: 'https://images.unsplash.com/photo-1589083130544-0d6a2926e519?w=1400&q=90' },
        { name: 'Cannes', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90' },
        { name: 'Aix-en-Provence', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90' },
        { name: 'Saint-Tropez', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90' },
      ]},
      Normandy: { img: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1400&q=90', cities: [
        { name: 'Rouen', img: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1400&q=90' },
        { name: 'Caen', img: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1400&q=90' },
        { name: 'Mont Saint-Michel', img: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1400&q=90' },
      ]},
      Alsace: { img: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1400&q=90', cities: [
        { name: 'Strasbourg', img: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1400&q=90' },
        { name: 'Colmar', img: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1400&q=90' },
      ]},
    },
  },
  Italy: {
    flag: '🇮🇹',
    img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1400&q=90',
    states: {
      Lazio: { img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1400&q=90', cities: [
        { name: 'Rome', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1400&q=90' },
        { name: 'Vatican City', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1400&q=90' },
        { name: 'Tivoli', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1400&q=90' },
      ]},
      Tuscany: { img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1400&q=90', cities: [
        { name: 'Florence', img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1400&q=90' },
        { name: 'Siena', img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1400&q=90' },
        { name: 'Pisa', img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1400&q=90' },
        { name: 'Lucca', img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1400&q=90' },
        { name: 'San Gimignano', img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1400&q=90' },
      ]},
      Veneto: { img: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1400&q=90', cities: [
        { name: 'Venice', img: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1400&q=90' },
        { name: 'Verona', img: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1400&q=90' },
        { name: 'Padua', img: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1400&q=90' },
      ]},
      Campania: { img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=1400&q=90', cities: [
        { name: 'Naples', img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=1400&q=90' },
        { name: 'Amalfi', img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=1400&q=90' },
        { name: 'Positano', img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=1400&q=90' },
        { name: 'Pompeii', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1400&q=90' },
        { name: 'Capri', img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=1400&q=90' },
      ]},
      Sicily: { img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90', cities: [
        { name: 'Palermo', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90' },
        { name: 'Catania', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90' },
        { name: 'Taormina', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90' },
        { name: 'Agrigento', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90' },
      ]},
    },
  },
  Greece: {
    flag: '🇬🇷',
    img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=90',
    states: {
      'South Aegean (Islands)': { img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=90', cities: [
        { name: 'Santorini', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=90' },
        { name: 'Mykonos', img: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=1400&q=90' },
        { name: 'Rhodes', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90' },
        { name: 'Paros', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=90' },
        { name: 'Naxos', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=90' },
        { name: 'Milos', img: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=1400&q=90' },
      ]},
      Attica: { img: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1400&q=90', cities: [
        { name: 'Athens', img: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1400&q=90' },
        { name: 'Piraeus', img: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1400&q=90' },
        { name: 'Delphi', img: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1400&q=90' },
      ]},
      Crete: { img: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=1400&q=90', cities: [
        { name: 'Heraklion', img: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=1400&q=90' },
        { name: 'Chania', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=90' },
        { name: 'Rethymno', img: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=1400&q=90' },
      ]},
      'Ionian Islands': { img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=90', cities: [
        { name: 'Corfu', img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=90' },
        { name: 'Zakynthos', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Kefalonia', img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=90' },
      ]},
    },
  },
  USA: {
    flag: '🇺🇸',
    img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1400&q=90',
    states: {
      'New York': { img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1400&q=90', cities: [
        { name: 'New York City', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1400&q=90' },
        { name: 'Buffalo', img: 'https://images.unsplash.com/photo-1565799737867-6b8e93e2e3f0?w=1400&q=90' },
        { name: 'Niagara Falls', img: 'https://images.unsplash.com/photo-1565799737867-6b8e93e2e3f0?w=1400&q=90' },
      ]},
      California: { img: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1400&q=90', cities: [
        { name: 'Los Angeles', img: 'https://images.unsplash.com/photo-1515896769750-31548aa180ed?w=1400&q=90' },
        { name: 'San Francisco', img: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1400&q=90' },
        { name: 'San Diego', img: 'https://images.unsplash.com/photo-1538689621163-f0bc1aec0369?w=1400&q=90' },
        { name: 'Palm Springs', img: 'https://images.unsplash.com/photo-1515896769750-31548aa180ed?w=1400&q=90' },
        { name: 'Santa Barbara', img: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1400&q=90' },
        { name: 'Napa Valley', img: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1400&q=90' },
      ]},
      Hawaii: { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90', cities: [
        { name: 'Honolulu', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Maui', img: 'https://images.unsplash.com/photo-1542897644-e834a6985be8?w=1400&q=90' },
        { name: 'Kauai', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Big Island', img: 'https://images.unsplash.com/photo-1542897644-e834a6985be8?w=1400&q=90' },
      ]},
      Florida: { img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90', cities: [
        { name: 'Miami', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Orlando', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Key West', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Tampa', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
      ]},
      Nevada: { img: 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=1400&q=90', cities: [
        { name: 'Las Vegas', img: 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=1400&q=90' },
        { name: 'Reno', img: 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=1400&q=90' },
      ]},
      'Washington DC': { img: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1400&q=90', cities: [
        { name: 'Washington DC', img: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1400&q=90' },
      ]},
    },
  },
  UAE: {
    flag: '🇦🇪',
    img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=90',
    states: {
      Dubai: { img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=90', cities: [
        { name: 'Dubai (Downtown)', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=90' },
        { name: 'Dubai Marina', img: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1400&q=90' },
        { name: 'JBR (Jumeirah Beach)', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=90' },
        { name: 'Palm Jumeirah', img: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1400&q=90' },
        { name: 'Deira (Old Dubai)', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=90' },
        { name: 'Dubai Creek', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=90' },
      ]},
      'Abu Dhabi': { img: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=1400&q=90', cities: [
        { name: 'Abu Dhabi City', img: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=1400&q=90' },
        { name: 'Yas Island', img: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=1400&q=90' },
        { name: 'Saadiyat Island', img: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=1400&q=90' },
        { name: 'Al Ain', img: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=1400&q=90' },
      ]},
      Sharjah: { img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=90', cities: [
        { name: 'Sharjah City', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=90' },
        { name: 'Khor Fakkan', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=90' },
      ]},
      'Ras Al Khaimah': { img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=90', cities: [
        { name: 'RAK City', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=90' },
        { name: 'Jebel Jais', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
      ]},
    },
  },
  Maldives: {
    flag: '🇲🇻',
    img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90',
    states: {
      'North Malé Atoll': { img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90', cities: [
        { name: 'Malé', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
        { name: 'Maafushi', img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90' },
        { name: 'Thulusdhoo', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
        { name: 'Hulhumalé', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
      ]},
      'Baa Atoll': { img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90', cities: [
        { name: 'Hanifaru Bay', img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90' },
        { name: 'Dharavandhoo', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
      ]},
      'Ari Atoll': { img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90', cities: [
        { name: 'North Ari Atoll', img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90' },
        { name: 'South Ari Atoll', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
        { name: 'Maamigili', img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90' },
      ]},
    },
  },
  Singapore: {
    flag: '🇸🇬',
    img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1559628233-100c798642d7?w=1400&q=90',
    states: {
      Singapore: { img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1400&q=90', cities: [
        { name: 'Marina Bay', img: 'https://images.unsplash.com/photo-1559628233-100c798642d7?w=1400&q=90' },
        { name: 'Sentosa', img: 'https://images.unsplash.com/photo-1569950044272-e796d9f60252?w=1400&q=90' },
        { name: 'Orchard Road', img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1400&q=90' },
        { name: 'Chinatown', img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1400&q=90' },
        { name: 'Little India', img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1400&q=90' },
        { name: 'Jurong', img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1400&q=90' },
      ]},
    },
  },
  Indonesia: {
    flag: '🇮🇩',
    img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90',
    states: {
      Bali: { img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90', cities: [
        { name: 'Ubud', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90' },
        { name: 'Seminyak', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90' },
        { name: 'Kuta', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90' },
        { name: 'Nusa Dua', img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90' },
        { name: 'Canggu', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90' },
        { name: 'Uluwatu', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90' },
        { name: 'Sanur', img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90' },
        { name: 'Nusa Penida', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90' },
        { name: 'Lovina', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90' },
      ]},
      Java: { img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&q=90', cities: [
        { name: 'Jakarta', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&q=90' },
        { name: 'Yogyakarta', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&q=90' },
        { name: 'Surabaya', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&q=90' },
        { name: 'Bandung', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&q=90' },
        { name: 'Borobudur', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&q=90' },
      ]},
      Lombok: { img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90', cities: [
        { name: 'Mataram', img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90' },
        { name: 'Gili Islands', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
        { name: 'Kuta Lombok', img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90' },
        { name: 'Senggigi', img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90' },
      ]},
      Komodo: { img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90', cities: [
        { name: 'Labuan Bajo', img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1400&q=90' },
        { name: 'Komodo Island', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90' },
      ]},
    },
  },
  Thailand: {
    flag: '🇹🇭',
    img: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1400&q=90',
    states: {
      Bangkok: { img: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1400&q=90', cities: [
        { name: 'Bangkok', img: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1400&q=90' },
        { name: 'Pattaya', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
      ]},
      'Northern Thailand': { img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1400&q=90', cities: [
        { name: 'Chiang Mai', img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1400&q=90' },
        { name: 'Chiang Rai', img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1400&q=90' },
        { name: 'Pai', img: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1400&q=90' },
      ]},
      Phuket: { img: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1400&q=90', cities: [
        { name: 'Phuket Town', img: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1400&q=90' },
        { name: 'Patong Beach', img: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1400&q=90' },
        { name: 'Kata Beach', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
      ]},
      'Southern Islands': { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90', cities: [
        { name: 'Koh Samui', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Koh Phangan', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Koh Tao', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
        { name: 'Krabi', img: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1400&q=90' },
        { name: 'Koh Phi Phi', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
      ]},
    },
  },
  'United Kingdom': {
    flag: '🇬🇧',
    img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400&q=90',
    states: {
      England: { img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400&q=90', cities: [
        { name: 'London', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400&q=90' },
        { name: 'Manchester', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400&q=90' },
        { name: 'Bath', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400&q=90' },
        { name: 'Oxford', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400&q=90' },
        { name: 'Cambridge', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400&q=90' },
        { name: 'Liverpool', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400&q=90' },
        { name: 'Brighton', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
      ]},
      Scotland: { img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90', cities: [
        { name: 'Edinburgh', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Glasgow', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Inverness', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Isle of Skye', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'St Andrews', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
      ]},
      Wales: { img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90', cities: [
        { name: 'Cardiff', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Snowdonia', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
      ]},
    },
  },
  Spain: {
    flag: '🇪🇸',
    img: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1559386484-97dfc0e15539?w=1400&q=90',
    states: {
      Catalonia: { img: 'https://images.unsplash.com/photo-1559386484-97dfc0e15539?w=1400&q=90', cities: [
        { name: 'Barcelona', img: 'https://images.unsplash.com/photo-1559386484-97dfc0e15539?w=1400&q=90' },
        { name: 'Girona', img: 'https://images.unsplash.com/photo-1559386484-97dfc0e15539?w=1400&q=90' },
        { name: 'Tarragona', img: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1400&q=90' },
      ]},
      Andalusia: { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90', cities: [
        { name: 'Seville', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90' },
        { name: 'Granada', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90' },
        { name: 'Málaga', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90' },
        { name: 'Córdoba', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90' },
        { name: 'Ronda', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90' },
      ]},
      Madrid: { img: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1400&q=90', cities: [
        { name: 'Madrid', img: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1400&q=90' },
        { name: 'Toledo', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90' },
        { name: 'Segovia', img: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1400&q=90' },
      ]},
      'Canary Islands': { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90', cities: [
        { name: 'Tenerife', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Gran Canaria', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Lanzarote', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90' },
      ]},
    },
  },
  Turkey: {
    flag: '🇹🇷',
    img: 'https://images.unsplash.com/photo-1568659697818-71db9ece4f53?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1400&q=90',
    states: {
      Istanbul: { img: 'https://images.unsplash.com/photo-1568659697818-71db9ece4f53?w=1400&q=90', cities: [
        { name: 'Istanbul', img: 'https://images.unsplash.com/photo-1568659697818-71db9ece4f53?w=1400&q=90' },
        { name: 'Princes Islands', img: 'https://images.unsplash.com/photo-1568659697818-71db9ece4f53?w=1400&q=90' },
      ]},
      Cappadocia: { img: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1400&q=90', cities: [
        { name: 'Göreme', img: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1400&q=90' },
        { name: 'Ürgüp', img: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1400&q=90' },
        { name: 'Avanos', img: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1400&q=90' },
      ]},
      'Aegean Coast': { img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=90', cities: [
        { name: 'Bodrum', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=90' },
        { name: 'Izmir', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=90' },
        { name: 'Ephesus', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1400&q=90' },
        { name: 'Pamukkale', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90' },
      ]},
      Antalya: { img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90', cities: [
        { name: 'Antalya', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90' },
        { name: 'Alanya', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90' },
        { name: 'Side', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=90' },
      ]},
    },
  },
  Vietnam: {
    flag: '🇻🇳',
    img: 'https://images.unsplash.com/photo-1557750255-c06af7e7e6ca?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=90',
    states: {
      North: { img: 'https://images.unsplash.com/photo-1557750255-c06af7e7e6ca?w=1400&q=90', cities: [
        { name: 'Hanoi', img: 'https://images.unsplash.com/photo-1557750255-c06af7e7e6ca?w=1400&q=90' },
        { name: 'Ha Long Bay', img: 'https://images.unsplash.com/photo-1557750255-c06af7e7e6ca?w=1400&q=90' },
        { name: 'Sapa', img: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1400&q=90' },
        { name: 'Ninh Binh', img: 'https://images.unsplash.com/photo-1557750255-c06af7e7e6ca?w=1400&q=90' },
      ]},
      Central: { img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=90', cities: [
        { name: 'Hội An', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=90' },
        { name: 'Da Nang', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Huế', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=90' },
      ]},
      South: { img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&q=90', cities: [
        { name: 'Ho Chi Minh City', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&q=90' },
        { name: 'Phú Quốc', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
        { name: 'Mekong Delta', img: 'https://images.unsplash.com/photo-1557750255-c06af7e7e6ca?w=1400&q=90' },
      ]},
    },
  },
  Morocco: {
    flag: '🇲🇦',
    img: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1400&q=90',
    states: {
      Marrakech: { img: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1400&q=90', cities: [
        { name: 'Marrakech', img: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1400&q=90' },
        { name: 'Essaouira', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
      ]},
      Fès: { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90', cities: [
        { name: 'Fès', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90' },
        { name: 'Meknès', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90' },
        { name: 'Volubilis', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1400&q=90' },
      ]},
      Sahara: { img: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1400&q=90', cities: [
        { name: 'Merzouga (Erg Chebbi)', img: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1400&q=90' },
        { name: 'Zagora', img: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1400&q=90' },
      ]},
      'Atlantic Coast': { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90', cities: [
        { name: 'Casablanca', img: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1400&q=90' },
        { name: 'Rabat', img: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1400&q=90' },
        { name: 'Agadir', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Chefchaouen', img: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1400&q=90' },
      ]},
    },
  },
  Australia: {
    flag: '🇦🇺',
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90',
    states: {
      'New South Wales': { img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90', cities: [
        { name: 'Sydney', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Hunter Valley', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1400&q=90' },
        { name: 'Blue Mountains', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Byron Bay', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
      ]},
      Victoria: { img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90', cities: [
        { name: 'Melbourne', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Great Ocean Road', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Yarra Valley', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1400&q=90' },
      ]},
      Queensland: { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90', cities: [
        { name: 'Brisbane', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Gold Coast', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Cairns', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
        { name: 'Whitsundays', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
      ]},
      'Western Australia': { img: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1400&q=90', cities: [
        { name: 'Perth', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Margaret River', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1400&q=90' },
        { name: 'Broome', img: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1400&q=90' },
      ]},
    },
  },
  'South Korea': {
    flag: '🇰🇷',
    img: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1400&q=90',
    states: {
      Seoul: { img: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1400&q=90', cities: [
        { name: 'Seoul', img: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1400&q=90' },
        { name: 'Hongdae', img: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1400&q=90' },
        { name: 'Gangnam', img: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1400&q=90' },
      ]},
      Busan: { img: 'https://images.unsplash.com/photo-1559628233-100c798642d7?w=1400&q=90', cities: [
        { name: 'Busan', img: 'https://images.unsplash.com/photo-1559628233-100c798642d7?w=1400&q=90' },
        { name: 'Haeundae', img: 'https://images.unsplash.com/photo-1559628233-100c798642d7?w=1400&q=90' },
      ]},
      Jeju: { img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90', cities: [
        { name: 'Jeju City', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Seogwipo', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
      ]},
      Gyeongju: { img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=90', cities: [
        { name: 'Gyeongju', img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=90' },
      ]},
    },
  },
  'Canada': {
    flag: '🇨🇦',
    img: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1400&q=90',
    states: {
      'British Columbia': { img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400&q=90', cities: [
        { name: 'Vancouver', img: 'https://images.unsplash.com/photo-1569620951618-d6b89eb13f0e?w=1400&q=90' },
        { name: 'Victoria', img: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1400&q=90' },
        { name: 'Whistler', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
      ]},
      'Ontario': { img: 'https://images.unsplash.com/photo-1569620951618-d6b89eb13f0e?w=1400&q=90', cities: [
        { name: 'Toronto', img: 'https://images.unsplash.com/photo-1569620951618-d6b89eb13f0e?w=1400&q=90' },
        { name: 'Ottawa', img: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1400&q=90' },
        { name: 'Niagara Falls', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=90' },
      ]},
      'Quebec': { img: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1400&q=90', cities: [
        { name: 'Montreal', img: 'https://images.unsplash.com/photo-1569620951618-d6b89eb13f0e?w=1400&q=90' },
        { name: 'Quebec City', img: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1400&q=90' },
      ]},
      'Alberta': { img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90', cities: [
        { name: 'Calgary', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Banff', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Edmonton', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
      ]},
    },
  },
  'New Zealand': {
    flag: '🇳🇿',
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90',
    states: {
      'North Island': { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90', cities: [
        { name: 'Auckland', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Wellington', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Rotorua', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Taupo', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
      ]},
      'South Island': { img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90', cities: [
        { name: 'Queenstown', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Christchurch', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
        { name: 'Milford Sound', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Nelson', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
      ]},
    },
  },
  'Brazil': {
    flag: '🇧🇷',
    img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1400&q=90',
    states: {
      'Rio de Janeiro': { img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1400&q=90', cities: [
        { name: 'Rio de Janeiro', img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1400&q=90' },
        { name: 'Búzios', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Paraty', img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1400&q=90' },
      ]},
      'São Paulo': { img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1400&q=90', cities: [
        { name: 'São Paulo', img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1400&q=90' },
        { name: 'Campinas', img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1400&q=90' },
      ]},
      'Bahia': { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90', cities: [
        { name: 'Salvador', img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1400&q=90' },
        { name: 'Morro de São Paulo', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
      ]},
      'Amazonas': { img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=90', cities: [
        { name: 'Manaus', img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=90' },
      ]},
    },
  },
  'Mexico': {
    flag: '🇲🇽',
    img: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1400&q=90',
    states: {
      'Mexico City': { img: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1400&q=90', cities: [
        { name: 'Mexico City', img: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1400&q=90' },
      ]},
      'Quintana Roo': { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90', cities: [
        { name: 'Cancún', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Tulum', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Playa del Carmen', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Isla Mujeres', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
      ]},
      'Jalisco': { img: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1400&q=90', cities: [
        { name: 'Guadalajara', img: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1400&q=90' },
        { name: 'Puerto Vallarta', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
      ]},
      'Oaxaca': { img: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1400&q=90', cities: [
        { name: 'Oaxaca City', img: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1400&q=90' },
      ]},
    },
  },
  'Sri Lanka': {
    flag: '🇱🇰',
    img: 'https://images.unsplash.com/photo-1580181592361-4e6e23cefb05?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1580181592361-4e6e23cefb05?w=1400&q=90',
    states: {
      'Western Province': { img: 'https://images.unsplash.com/photo-1580181592361-4e6e23cefb05?w=1400&q=90', cities: [
        { name: 'Colombo', img: 'https://images.unsplash.com/photo-1580181592361-4e6e23cefb05?w=1400&q=90' },
      ]},
      'Central Province': { img: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1400&q=90', cities: [
        { name: 'Kandy', img: 'https://images.unsplash.com/photo-1580181592361-4e6e23cefb05?w=1400&q=90' },
        { name: 'Nuwara Eliya', img: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1400&q=90' },
      ]},
      'Southern Province': { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90', cities: [
        { name: 'Galle', img: 'https://images.unsplash.com/photo-1580181592361-4e6e23cefb05?w=1400&q=90' },
        { name: 'Mirissa', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
        { name: 'Unawatuna', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
      ]},
    },
  },
  'Nepal': {
    flag: '🇳🇵',
    img: 'https://images.unsplash.com/photo-1585016495481-91f67a416808?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1585016495481-91f67a416808?w=1400&q=90',
    states: {
      'Bagmati': { img: 'https://images.unsplash.com/photo-1585016495481-91f67a416808?w=1400&q=90', cities: [
        { name: 'Kathmandu', img: 'https://images.unsplash.com/photo-1585016495481-91f67a416808?w=1400&q=90' },
        { name: 'Bhaktapur', img: 'https://images.unsplash.com/photo-1585016495481-91f67a416808?w=1400&q=90' },
        { name: 'Patan', img: 'https://images.unsplash.com/photo-1585016495481-91f67a416808?w=1400&q=90' },
      ]},
      'Gandaki': { img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90', cities: [
        { name: 'Pokhara', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90' },
        { name: 'Annapurna', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90' },
      ]},
    },
  },
  'Philippines': {
    flag: '🇵🇭',
    img: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1400&q=90',
    heroImg: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1400&q=90',
    states: {
      'Metro Manila': { img: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1400&q=90', cities: [
        { name: 'Manila', img: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1400&q=90' },
        { name: 'Makati', img: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1400&q=90' },
        { name: 'Bonifacio Global City', img: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1400&q=90' },
      ]},
      'Palawan': { img: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1400&q=90', cities: [
        { name: 'El Nido', img: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1400&q=90' },
        { name: 'Coron', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
        { name: 'Puerto Princesa', img: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1400&q=90' },
      ]},
      'Cebu': { img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90', cities: [
        { name: 'Cebu City', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1400&q=90' },
        { name: 'Moalboal', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90' },
      ]},
    },
  },

}

// ─── INSPIRING RIGHT-PANEL IMAGES for neutral/default state ──────────────────
const HERO_IMAGES = [
  { img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90', label: 'Ladakh, India' },
  { img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=90', label: 'Kyoto, Japan' },
  { img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=90', label: 'Santorini, Greece' },
  { img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1400&q=90', label: 'Paris, France' },
  { img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=90', label: 'Bali, Indonesia' },
  { img: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1400&q=90', label: 'Cappadocia, Turkey' },
]

const CURRENCIES = [
  { code: 'INR', symbol: '₹', min: 500 },
  { code: 'USD', symbol: '$', min: 50 },
  { code: 'EUR', symbol: '€', min: 50 },
  { code: 'GBP', symbol: '£', min: 40 },
  { code: 'JPY', symbol: '¥', min: 5000 },
  { code: 'AUD', symbol: 'A$', min: 70 },
  { code: 'CAD', symbol: 'C$', min: 60 },
  { code: 'SGD', symbol: 'S$', min: 60 },
]

const INTERESTS = [
  { label: 'History & Culture', emoji: '🏛️', value: 'history_culture' },
  { label: 'Food & Dining', emoji: '🍜', value: 'food_dining' },
  { label: 'Nature & Outdoors', emoji: '🏔️', value: 'nature_outdoors' },
  { label: 'Arts & Music', emoji: '🎭', value: 'arts_entertainment' },
  { label: 'Shopping', emoji: '🛍️', value: 'shopping' },
  { label: 'Beaches', emoji: '🏖️', value: 'beaches_water' },
  { label: 'Adventure', emoji: '⚡', value: 'adventure_sports' },
  { label: 'Wellness & Spa', emoji: '🧘', value: 'wellness' },
]
const STYLES = [
  { label: 'Slow & Relaxed', emoji: '😌', value: 'relaxed', hint: 'Easy pace, plenty of breathing room' },
  { label: 'Balanced', emoji: '⚖️', value: 'balanced', hint: 'A little of everything' },
  { label: 'Packed & Exciting', emoji: '⚡', value: 'active', hint: 'See everything, miss nothing' },
  { label: 'Luxury', emoji: '✨', value: 'luxury', hint: 'High-end, unforgettable experiences' },
  { label: 'Budget Smart', emoji: '💡', value: 'budget', hint: 'Maximum fun, minimum spend' },
]
const ARRIVAL_OPTS = [
  { value: 'morning', emoji: '🌅', label: 'Morning', hint: 'Full day ahead' },
  { value: 'afternoon', emoji: '☀️', label: 'Afternoon', hint: 'Half day — a gentle start' },
  { value: 'evening', emoji: '🌆', label: 'Evening', hint: 'Dinner + settle in' },
  { value: 'night', emoji: '🌙', label: 'Night / Red-eye', hint: 'Rest only — recover Day 1' },
  { value: 'unknown', emoji: '—', label: 'Not sure yet', hint: "We'll keep Day 1 light" },
]
const ENERGY_OPTS = [
  { value: 'low', emoji: '😴', label: 'Needs rest', hint: 'Easy days, recovery time built in' },
  { value: 'medium', emoji: '🚶', label: 'Can push a little', hint: 'Balanced — active but not exhausting' },
  { value: 'high', emoji: '🏃', label: 'High energy', hint: 'Pack it in — fill every day' },
]
const PURPOSE_OPTS = [
  { value: 'leisure', label: 'Leisure', hint: 'Rest, explore, enjoy' },
  { value: 'honeymoon', label: 'Honeymoon', hint: 'Romantic, private, memorable' },
  { value: 'family', label: 'Family trip', hint: 'Kid-friendly pace and activities' },
  { value: 'friends', label: 'Friends trip', hint: 'Social, fun, flexible' },
  { value: 'workcation', label: 'Work + leisure', hint: 'Balance productivity and adventure' },
]
const PLANNING_OPTS = [
  { value: 'tight', label: 'Tight plan', hint: 'Every hour accounted for' },
  { value: 'balanced', label: 'Structured with flex', hint: 'Main things planned, room to wander' },
  { value: 'loose', label: 'Flexible suggestions', hint: 'Rough ideas, decide as you go' },
]
const LOADING_MESSAGES = [
  "Finding places you'll love…",
  'Making sure it all flows smoothly…',
  'Leaving room for surprises…',
  'Checking realistic timing for Day 1…',
  "Almost there — this one's going to be great.",
]

interface FormState {
  alreadyThere: boolean | null
  fromCountry: string; fromState: string; fromCity: string
  arrivalTime: string; energyLevel: string
  destCountry: string; destState: string; destCity: string
  startDate: string; endDate: string
  travelers: number; budget: string; currency: string
  interests: string[]; travelStyle: string
  tripPurpose: string; planningStyle: string
}

function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', lineHeight: 1, userSelect: 'none' }}>
    <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, fontStyle: 'italic', fontSize: `${size}px`, color: '#1a1612' }}>this</span>
    <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, fontStyle: 'italic', fontSize: `${size * 0.55}px`, color: '#2a9d8f', margin: `0 ${size * 0.06}px`, alignSelf: 'center' }}>·</span>
    <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontSize: `${size}px`, color: '#1a1612', letterSpacing: '-0.02em' }}>Way</span>
    </span>
  )
}

// ─── LOCATION PICKER — Beautiful dropdown with search ────────────────────────
interface LocationPickerProps {
  label?: string
  selectedCountry: string; selectedState: string; selectedCity: string
  onCountry: (c: string) => void
  onState: (s: string) => void
  onCity: (c: string) => void
  onLocateMe?: () => void
  locating?: boolean
}

// Searchable dropdown combobox
function SearchSelect({ label, value, options, placeholder, onChange, onClear }: {
  label: string; value: string; options: string[]; placeholder: string;
  onChange: (v: string) => void; onClear?: () => void;
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const ref = React.useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 38px 11px 13px',
    background: value ? 'rgba(42,157,143,0.04)' : 'white',
    border: `1.5px solid ${value ? '#2a9d8f' : open ? '#2a9d8f' : 'rgba(26,22,18,0.1)'}`,
    borderRadius: open ? '12px 12px 0 0' : '12px',
    color: value ? '#1a1612' : 'rgba(26,22,18,0.35)',
    fontFamily: "'DM Sans',sans-serif", fontSize: '14px', outline: 'none',
    boxShadow: value ? '0 0 0 3px rgba(42,157,143,0.1)' : open ? '0 0 0 3px rgba(42,157,143,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
    cursor: 'text', transition: 'all 0.18s ease',
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <p className="bf" style={{ color: 'rgba(26,22,18,0.35)', fontSize: '11px', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <div style={{ position: 'relative' }}>
        <input
          style={inputStyle}
          value={open ? query : value}
          placeholder={value || placeholder}
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={e => setQuery(e.target.value)}
        />
        {/* chevron / clear icon */}
        <span
          onClick={() => { if (value && onClear) { onClear(); setQuery(''); setOpen(false) } else setOpen(o => !o) }}
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: value ? '#2a9d8f' : '#aaa', lineHeight: 1 }}
        >
          {value ? '✕' : '▾'}
        </span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'white', border: '1.5px solid #2a9d8f', borderTop: 'none',
          borderRadius: '0 0 12px 12px', maxHeight: '220px', overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', color: 'rgba(26,22,18,0.4)', fontSize: '13px', fontFamily: "'DM Sans',sans-serif" }}>No results</div>
          ) : filtered.map(opt => (
            <div key={opt}
              onMouseDown={e => { e.preventDefault(); onChange(opt); setQuery(''); setOpen(false) }}
              style={{
                padding: '10px 14px', fontSize: '13px', fontFamily: "'DM Sans',sans-serif",
                color: opt === value ? '#2a9d8f' : '#1a1612',
                background: opt === value ? 'rgba(42,157,143,0.06)' : 'white',
                cursor: 'pointer', fontWeight: opt === value ? 500 : 400,
                borderBottom: '1px solid rgba(26,22,18,0.04)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(42,157,143,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = opt === value ? 'rgba(42,157,143,0.06)' : 'white')}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LocationPicker({ label, selectedCountry, selectedState, selectedCity, onCountry, onState, onCity, onLocateMe, locating }: LocationPickerProps) {
  const countryData = selectedCountry ? LOCATION_DB[selectedCountry] : null
  const stateData = (countryData && selectedState) ? countryData.states[selectedState] : null
  const countries = Object.keys(LOCATION_DB).sort()
  const states = countryData ? Object.keys(countryData.states).sort() : []
  const cities = stateData ? stateData.cities.map(c => c.name) : []

  // Free-text mode: country typed but not in DB
  const [freeState, setFreeState] = React.useState('')
  const [freeCity, setFreeCity] = React.useState('')
  const isCustom = !!selectedCountry && !LOCATION_DB[selectedCountry]

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: 'white',
    border: '1.5px solid rgba(26,22,18,0.1)', borderRadius: '12px',
    color: '#1a1612', fontFamily: "'DM Sans',sans-serif", fontSize: '14px',
    outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {label && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <p className="bf" style={{ color: 'rgba(26,22,18,0.38)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      {onLocateMe && (
        <button onClick={onLocateMe} disabled={locating} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'none', border: 'none', cursor: locating ? 'not-allowed' : 'pointer',
          color: locating ? 'rgba(42,157,143,0.4)' : '#2a9d8f',
          fontFamily: "'DM Sans',sans-serif", fontSize: '12px', fontWeight: 500,
          padding: '0', transition: 'opacity 0.2s',
        }}>
        {locating ? (
          <><span style={{ display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', border:'1.5px solid rgba(42,157,143,0.2)', borderTopColor:'#2a9d8f', animation:'spin 0.65s linear infinite' }} />Locating…</>
        ) : (
          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>Locate me</>
        )}
        </button>
      )}
      </div>
    )}

    {/* Country — searchable */}
    <SearchSelect
      label="Country"
      value={selectedCountry}
      options={countries}
      placeholder="Search country…"
      onChange={v => { onCountry(v); onState(''); onCity(''); setFreeState(''); setFreeCity('') }}
      onClear={() => { onCountry(''); onState(''); onCity(''); setFreeState(''); setFreeCity('') }}
    />

    {/* If country is in DB — show searchable state + city */}
    {selectedCountry && !isCustom && states.length > 0 && (
      <div style={{ animation: 'revDown 0.22s cubic-bezier(0.16,1,0.3,1) forwards' }}>
        <SearchSelect
          label={['India', 'USA', 'Australia', 'Canada'].includes(selectedCountry) ? 'State' : 'Region'}
          value={selectedState}
          options={states}
          placeholder={`Search ${['India', 'USA', 'Australia', 'Canada'].includes(selectedCountry) ? 'state' : 'region'}…`}
          onChange={v => { onState(v); onCity('') }}
          onClear={() => { onState(''); onCity('') }}
        />
      </div>
    )}
    {selectedState && !isCustom && cities.length > 0 && (
      <div style={{ animation: 'revDown 0.22s cubic-bezier(0.16,1,0.3,1) forwards' }}>
        <SearchSelect
          label="City / Area"
          value={selectedCity}
          options={cities}
          placeholder="Search city…"
          onChange={v => onCity(v)}
          onClear={() => onCity('')}
        />
      </div>
    )}

    {/* If country NOT in DB — show free-text fields */}
    {isCustom && (
      <div style={{ animation: 'revDown 0.22s cubic-bezier(0.16,1,0.3,1) forwards', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <p className="bf" style={{ color: 'rgba(26,22,18,0.35)', fontSize: '11px', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Region / State</p>
          <input style={inputStyle} placeholder="e.g. Catalonia, Seoul, Bavaria…"
            value={freeState}
            onChange={e => { setFreeState(e.target.value); onState(e.target.value) }}
            onFocus={e => { e.currentTarget.style.borderColor = '#2a9d8f'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(42,157,143,0.1)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(26,22,18,0.1)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
          />
        </div>
        <div>
          <p className="bf" style={{ color: 'rgba(26,22,18,0.35)', fontSize: '11px', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>City / Area</p>
          <input style={inputStyle} placeholder="e.g. Gyeongju, Bruges, Chiang Rai…"
            value={freeCity}
            onChange={e => { setFreeCity(e.target.value); onCity(e.target.value) }}
            onFocus={e => { e.currentTarget.style.borderColor = '#2a9d8f'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(42,157,143,0.1)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(26,22,18,0.1)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
          />
        </div>
        <div style={{ padding: '8px 12px', borderRadius: '9px', background: 'rgba(42,157,143,0.06)', border: '1px solid rgba(42,157,143,0.14)' }}>
          <p className="bf" style={{ fontSize: '12px', color: '#2a9d8f' }}>✦ Custom destination — our AI will plan your trip anywhere!</p>
        </div>
      </div>
    )}
    </div>
  )
}

function getLocationImg(country: string, state?: string, city?: string): string | null {
  const c = LOCATION_DB[country]
  if (!c) {
    // Unknown country — return a generic beautiful travel fallback
    return 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1400&q=90'
  }
  if (state && c.states[state]) {
    const s = c.states[state]
    if (city) { const found = s.cities.find(ci => ci.name === city); if (found) return found.img }
    return s.img
  }
  return c.heroImg || c.img
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PlanPage() {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [q, setQ] = useState(0)
  const [direction, setDirection] = useState<'f' | 'b'>('f')
  const [animating, setAnimating] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [error, setError] = useState('')
  const [locatingFrom, setLocatingFrom] = useState(false)
  const [locatingDest, setLocatingDest] = useState(false)
  
  // Right panel
  const [bgImg, setBgImg] = useState<string | null>(null)
  const [bgFade, setBgFade] = useState(false)
  const [heroIdx, setHeroIdx] = useState(0)
  const [heroLabel, setHeroLabel] = useState(HERO_IMAGES[0].label)
  
  const [form, setForm] = useState<FormState>({
    alreadyThere: null,
    fromCountry: '', fromState: '', fromCity: '',
    arrivalTime: '', energyLevel: '',
    destCountry: '', destState: '', destCity: '',
    startDate: '', endDate: '',
    travelers: 1, budget: '', currency: 'INR',
    interests: [], travelStyle: '',
    tripPurpose: '', planningStyle: '',
  })
  
  // Rotate hero images when no destination selected
  useEffect(() => {
    const t = setInterval(() => {
      setHeroIdx(i => {
        const next = (i + 1) % HERO_IMAGES.length
        setHeroLabel(HERO_IMAGES[next].label)
        return next
      })
    }, 5000)
    return () => clearInterval(t)
  }, [])
  
  const currency = CURRENCIES.find(c => c.code === form.currency) || CURRENCIES[0]
  const tripDays = daysBetween(form.startDate, form.endDate)
  const budgetNum = parseFloat(form.budget) || 0
  const perPerson = form.travelers > 0 ? budgetNum / form.travelers : budgetNum
  const budgetLow = form.budget !== '' && perPerson < currency.min
  const destFull = [form.destCity, form.destState, form.destCountry].filter(Boolean).join(', ')
  const totalQ = form.alreadyThere ? 9 : 10
  const visibleQ = form.alreadyThere && q >= 2 ? q - 1 : q
  const progress = Math.min((visibleQ / (totalQ - 1)) * 100, 100)
  
  // Update right panel image
  useEffect(() => {
    let img: string | null = null
    if (form.destCountry) img = getLocationImg(form.destCountry, form.destState || undefined, form.destCity || undefined)
      if (img !== bgImg) {
      setBgFade(true)
      setTimeout(() => { setBgImg(img); setBgFade(false) }, 350)
    }
  }, [form.destCountry, form.destState, form.destCity])
  
  // ── Locate Me ──
  const handleLocateMe = (forField: 'from' | 'dest') => {
    if (!navigator.geolocation) { showToast('Geolocation not supported'); return }
    if (forField === 'from') setLocatingFrom(true)
      else setLocatingDest(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `/api/geocode?lat=${latitude}&lon=${longitude}`
          )
          const data = await res.json()
          const addr = data.address || {}
          const detectedCountry = addr.country || ''
          const detectedState = addr.state || addr.region || ''
          const detectedCity = addr.city || addr.town || addr.village || addr.county || ''
          
          // Match to our DB
          let matchedCountry = ''
          let matchedState = ''
          let matchedCity = ''
          
          const countryKeys = Object.keys(LOCATION_DB)
          for (const key of countryKeys) {
            if (detectedCountry.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(detectedCountry.toLowerCase())) {
              matchedCountry = key; break
            }
          }
          if (matchedCountry) {
            const stateKeys = Object.keys(LOCATION_DB[matchedCountry].states)
            for (const sk of stateKeys) {
              if (detectedState.toLowerCase().includes(sk.toLowerCase()) || sk.toLowerCase().includes(detectedState.toLowerCase())) {
                matchedState = sk; break
              }
            }
            if (matchedState) {
              const cityList = LOCATION_DB[matchedCountry].states[matchedState].cities
              const normalize = (s: string) =>
                s.toLowerCase()
              .replace(/[^a-z]/g, '')
              .replace('bengaluru', 'bangalore')
              .replace('mysuru', 'mysore')
              
              for (const c of cityList) {
                if (normalize(detectedCity) === normalize(c.name)) {
                  matchedCity = c.name
                  break
                }
              }
            }
          }
          
          if (matchedCountry) {
            if (forField === 'from') {
              setForm(f => ({
                ...f,
                fromCountry: matchedCountry,
                fromState: matchedState,
                fromCity: matchedCity || ''
              }))
            } else {
              setForm(f => ({
                ...f,
                destCountry: matchedCountry,
                destState: matchedState,
                destCity: matchedCity || ''
              }))
            }
            
            showToast(
              matchedCity
              ? `📍 Located: ${matchedCity}, ${matchedCountry}`
              : `📍 Located: ${matchedState || matchedCountry} — select city`
            )
          } else {
            showToast(`📍 Detected: ${detectedCity || detectedCountry} — please select manually`)
          }
        } catch {
          showToast('Could not detect location — please select manually')
        } finally {
          if (forField === 'from') setLocatingFrom(false)
            else setLocatingDest(false)
        }
      },
      () => {
        showToast('Location access denied')
        if (forField === 'from') setLocatingFrom(false)
          else setLocatingDest(false)
      },
      { timeout: 8000 }
    )
  }
  
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
      setToast(msg)
    toastTimer.current = setTimeout(() => setToast(''), 3000)
  }
  
  const goNext = (nextQ?: number) => {
    if (animating) return
    setError(''); setDirection('f'); setAnimating(true)
    setTimeout(() => { setQ(nextQ ?? q + 1); setAnimating(false) }, 240)
  }
  const goBack = () => {
    if (animating || q === 0) return
    setError(''); setDirection('b'); setAnimating(true)
    setTimeout(() => {
      let prev = q - 1
      if (form.alreadyThere && prev === 1) prev = 0
      setQ(prev); setToast(''); setAnimating(false)
    }, 240)
  }
  
  const handleAlreadyThere = () => {
    setForm(f => ({ ...f, alreadyThere: true, fromCountry: '', fromState: '', fromCity: '', arrivalTime: 'already_there' }))
    goNext(2)
  }
  const handleTravelingThere = () => { setForm(f => ({ ...f, alreadyThere: false })) }
  const handleFromDone = () => {
    if (!form.fromCountry) { setError('Select a country to continue'); return }
    if (!form.fromState) { setError('Select a state or region'); return }
    if (!form.fromCity) { setError('Select a city'); return }
    goNext(1)
  }
  const handleArrival = (val: string) => { setForm(f => ({ ...f, arrivalTime: val })); goNext(2) }
  const handleEnergy = (val: string) => { setForm(f => ({ ...f, energyLevel: val })); goNext(3) }
  const handleDestDone = () => {
    if (!form.destCountry) { setError('Select a country to continue'); return }
    // For custom (unlisted) destinations, state/city can be optional
    const isCustomDest = !LOCATION_DB[form.destCountry]
    if (!isCustomDest && !form.destState) { setError('Select a state or region'); return }
    if (!isCustomDest && !form.destCity) { setError('Select a city'); return }
    goNext(4)
  }
  const handleDates = () => {
    if (!form.startDate) { setError('Pick a start date'); return }
    if (!form.endDate) { setError('Pick an end date'); return }
    if (form.startDate < localToday) { setError("Trips can't start in the past"); return }
    if (tripDays <= 0) { setError('End date must be after start date'); return }
    if (tripDays > 30) { setError('Trips are limited to 30 days'); return }
    // removed toast
      goNext(5)
  }
  const handleTravelersAndBudget = () => {
    if (form.budget && parseFloat(form.budget) > 1_000_000) { setError(`Max budget is 1,000,000 ${form.currency}`); return }
    goNext(6)
  }
  const handlePurpose = (val: string) => { setForm(f => ({ ...f, tripPurpose: val })); goNext(7) }
  const toggleInterest = (val: string) => {
    setError('')
    setForm(f => ({ ...f, interests: f.interests.includes(val) ? f.interests.filter(i => i !== val) : [...f.interests, val] }))
  }
  const handleInterests = () => {
    if (form.interests.length === 0) { setError('Pick at least one'); return }
    goNext(8)
  }
  const handlePlanningStyle = (val: string) => { setForm(f => ({ ...f, planningStyle: val })); goNext(9) }
  const handleSubmit = async () => {
    if (!form.travelStyle) { setError('Pick a vibe for your trip'); return }
    setGenerating(true)
    const interval = setInterval(() => setLoadingMsg(m => (m + 1) % LOADING_MESSAGES.length), 2500)
    try {
      const payload = { ...form, destination: destFull, userEmail: session?.user?.email, userName: session?.user?.name }
      const tripRes = await fetch('/api/trips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const trip = await tripRes.json()
      if (!trip.id) throw new Error('Trip creation failed')
        const genRes = await fetch(`/api/trips/${trip.id}/itinerary/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const itinerary = await genRes.json()
      if (itinerary.error) throw new Error(itinerary.details || itinerary.error)
        localStorage.setItem(`trip_${trip.id}`, JSON.stringify(trip))
      localStorage.setItem(`itinerary_${trip.id}`, JSON.stringify(itinerary))
      router.push(`/trip/${trip.id}`)
    } catch (err: any) {
      clearInterval(interval); setGenerating(false)
      setError(`Something went wrong — ${err.message}. Try again?`)
    } finally { clearInterval(interval) }
  }
  
  if (generating) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,300&family=DM+Sans:wght@300;400&display=swap');
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes pulse{0%,100%{opacity:0.25;transform:scale(0.75)}50%{opacity:1;transform:scale(1)}}
        `}</style>
        <div style={{ width: '46px', height: '46px', borderRadius: '50%', border: '1.5px solid rgba(42,157,143,0.15)', borderTopColor: '#2a9d8f', animation: 'spin 0.85s linear infinite', marginBottom: '28px' }} />
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", color: '#1a1612', fontSize: '24px', fontWeight: 700, marginBottom: '10px', textAlign: 'center', maxWidth: '360px', lineHeight: 1.3 }}>Building your itinerary</h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", color: '#2a9d8f', fontSize: '14px', fontWeight: 300 }}>{LOADING_MESSAGES[loadingMsg]}</p>
        <div style={{ display: 'flex', gap: '6px', marginTop: '24px' }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2a9d8f', animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}
        </div>
        </div>
      )
    }
    
    const rpLabel = form.destCity
    ? `${LOCATION_DB[form.destCountry]?.flag || '🌍'} ${form.destCity}, ${form.destState}`
    : form.destState ? `${LOCATION_DB[form.destCountry]?.flag || '🌍'} ${form.destState}, ${form.destCountry}`
    : form.destCountry ? `${LOCATION_DB[form.destCountry]?.flag || '🌍'} ${form.destCountry}` : null
    
    const showingHero = !bgImg
    const currentHeroImg = HERO_IMAGES[heroIdx].img
    
    return (
      <div style={{ minHeight: '100vh', display: 'flex', background: '#faf8f4', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        :root{--ink:#1a1612;--canvas:#faf8f4;--teal:#2a9d8f;--teal-deep:#1a6a63;--muted:rgba(26,22,18,0.44);--border:rgba(26,22,18,0.08);}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .bf{font-family:'DM Sans',sans-serif;}.hf{font-family:'Cormorant Garamond',Georgia,serif;}
        .prog{position:fixed;top:0;left:0;height:2.5px;background:linear-gradient(90deg,#2a9d8f,#1a6a63);z-index:200;transition:width 0.5s cubic-bezier(0.4,0,0.2,1);border-radius:0 2px 2px 0;}
        .slide-f{animation:sf 0.24s cubic-bezier(0.16,1,0.3,1) forwards;}
        .slide-b{animation:sb 0.24s cubic-bezier(0.16,1,0.3,1) forwards;}
        .exit-f{animation:ef 0.18s ease-in forwards;}.exit-b{animation:eb 0.18s ease-in forwards;}
        @keyframes sf{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:translateX(0)}}
        @keyframes sb{from{opacity:0;transform:translateX(-22px)}to{opacity:1;transform:translateX(0)}}
        @keyframes ef{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-22px)}}
        @keyframes eb{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(22px)}}
        @keyframes revDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .reveal{animation:revDown 0.28s cubic-bezier(0.16,1,0.3,1) forwards;}
        .opt{width:100%;padding:13px 17px;border-radius:13px;border:1.5px solid var(--border);background:white;cursor:pointer;text-align:left;display:flex;align-items:center;gap:13px;transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 1px 3px rgba(0,0,0,0.04);}
        .opt:hover{border-color:rgba(42,157,143,0.3);background:rgba(42,157,143,0.02);transform:translateX(3px);}
        .opt.sel{border-color:var(--teal);background:rgba(42,157,143,0.05);transform:translateX(5px);box-shadow:0 0 0 3px rgba(42,157,143,0.09);}
        .chip{padding:8px 14px;border-radius:100px;border:1.5px solid var(--border);background:white;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--muted);transition:all 0.18s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 1px 3px rgba(0,0,0,0.04);}
        .chip:hover{border-color:rgba(42,157,143,0.28);transform:translateY(-2px);box-shadow:0 4px 10px rgba(0,0,0,0.07);}
        .chip.sel{border-color:var(--teal);background:rgba(42,157,143,0.05);color:var(--ink);transform:translateY(-2px);box-shadow:0 0 0 3px rgba(42,157,143,0.09);}
        .dinput{width:100%;padding:12px 14px;background:white;border:1.5px solid var(--border);border-radius:11px;color:var(--ink);font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.2s,box-shadow 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
        .dinput:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(42,157,143,0.1);}
        .ninput{width:100%;padding:12px 14px;background:white;border:1.5px solid var(--border);border-radius:11px;color:var(--ink);font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.2s,box-shadow 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
        .ninput::placeholder{color:rgba(26,22,18,0.22);}
        .ninput:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(42,157,143,0.1);}
        .cur-btn{padding:7px 10px;border-radius:8px;border:1.5px solid var(--border);background:white;color:var(--muted);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;transition:all 0.16s cubic-bezier(0.34,1.56,0.64,1);white-space:nowrap;}
        .cur-btn:hover{border-color:rgba(42,157,143,0.28);transform:translateY(-1px);}
        .cur-btn.sel{border-color:var(--teal);background:rgba(42,157,143,0.06);color:var(--ink);font-weight:500;}
        .cta{display:inline-flex;align-items:center;gap:9px;padding:13px 28px;background:var(--ink);color:white;border:none;border-radius:100px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:transform 0.26s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.26s ease;box-shadow:0 4px 16px rgba(0,0,0,0.12);}
        .cta:hover{transform:scale(1.04) translateY(-2px);box-shadow:0 14px 40px rgba(0,0,0,0.18);}
        .cta-arr{transition:transform 0.26s cubic-bezier(0.34,1.56,0.64,1);}
        .cta:hover .cta-arr{transform:translateX(5px);}
        .cta-teal{background:linear-gradient(135deg,var(--teal),var(--teal-deep));box-shadow:0 8px 28px rgba(42,157,143,0.28);}
        .back{display:flex;align-items:center;gap:5px;background:none;border:none;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;transition:color 0.2s;padding:0;}
        .back:hover{color:var(--ink);}
        .err{color:#dc2626;font-family:'DM Sans',sans-serif;font-size:13px;margin-top:7px;}
        .pill{display:flex;align-items:center;gap:7px;padding:7px 13px;border-radius:9px;background:rgba(42,157,143,0.07);border:1px solid rgba(42,157,143,0.14);}
        .toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:100px;background:var(--ink);color:white;font-family:'DM Sans',sans-serif;font-size:13px;white-space:nowrap;z-index:300;box-shadow:0 6px 24px rgba(0,0,0,0.16);animation:toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;}
        @keyframes toastIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
        .srow{padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.07);}
        .srow:last-child{border-bottom:none;}
        .tnum{width:40px;height:40px;border-radius:10px;border:1.5px solid var(--border);background:white;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.16s cubic-bezier(0.34,1.56,0.64,1);}
        .tnum:hover{border-color:rgba(42,157,143,0.28);transform:scale(1.08);}
        .tnum.sel{border-color:var(--teal);background:rgba(42,157,143,0.06);color:var(--ink);transform:scale(1.11);box-shadow:0 0 0 2px rgba(42,157,143,0.1);}
        .bg-layer{position:absolute;inset:0;background-size:cover;background-position:center;}
        .hero-fade{transition:opacity 1.2s ease;}
      `}</style>
        
        <div className="prog" style={{ width: `${progress}%` }} />
        
        {/* ══ LEFT PANEL ══ */}
        <div style={{ flex: '0 0 52%', display: 'flex', flexDirection: 'column', padding: '0 64px', justifyContent: 'center', minHeight: '100vh', position: 'relative', background: '#faf8f4', zIndex: 10, overflowY: 'auto' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(250,248,244,0.96)', backdropFilter: 'blur(12px)', padding: '20px 0', marginBottom: '4px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="back" onClick={q === 0 ? () => router.push('/dashboard') : goBack}>
        ← {q === 0 ? 'Dashboard' : 'Back'}
        </button>
        <Wordmark size={20} />
        <span className="bf" style={{ color: 'rgba(26,22,18,0.28)', fontSize: '12px' }}>{visibleQ + 1} / {totalQ}</span>
        </div>
        
        <div style={{ maxWidth: '440px', paddingTop: '32px', paddingBottom: '48px' }}>
        <div className={animating ? (direction === 'f' ? 'exit-f' : 'exit-b') : (direction === 'f' ? 'slide-f' : 'slide-b')}>
        
        {/* Q0 */}
        {q === 0 && (
          <div>
          <p className="bf" style={{ color: 'var(--teal)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '8px' }}>Starting point</p>
          <h2 className="hf" style={{ color: 'var(--ink)', fontSize: 'clamp(24px,3.2vw,36px)', fontWeight: 700, lineHeight: 1.12, marginBottom: '8px' }}>Are you already at<br />your destination?</h2>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '22px', fontWeight: 300 }}>This helps us avoid rushing you on Day 1.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <button className={`opt${form.alreadyThere ? ' sel' : ''}`} onClick={handleAlreadyThere}>
          <span style={{ fontSize: '19px' }}>📍</span>
          <div><p className="bf" style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '14px' }}>Yes, I'm already there</p><p className="bf" style={{ color: 'var(--muted)', fontSize: '12px' }}>No travel day — Day 1 starts fresh</p></div>
          </button>
          <button className={`opt${(!form.alreadyThere && form.fromCountry) ? ' sel' : ''}`} onClick={handleTravelingThere}>
          <span style={{ fontSize: '19px' }}>🛫</span>
          <div><p className="bf" style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '14px' }}>No, I'm traveling there</p><p className="bf" style={{ color: 'var(--muted)', fontSize: '12px' }}>We'll factor in your travel day</p></div>
          </button>
          </div>
          
          {/* Show origin fields ONLY if user is traveling there */}
          {form.alreadyThere === false && (
            <>
            <p className="mt-6 text-xs tracking-widest uppercase text-neutral-500">
            Where are you starting from?
            </p>
            
            <button
            type="button"
            onClick={() => handleLocateMe("from")}
            className="text-sm text-emerald-600 mt-2"
            >
            📍 Locate me
            </button>
            
            <LocationPicker
            selectedCountry={form.fromCountry}
            selectedState={form.fromState}
            selectedCity={form.fromCity}
            onCountry={(val) =>
              setForm((f) => ({
                ...f,
                fromCountry: val,
                fromState: "",
                fromCity: "",
              }))
            }
            onState={(val) =>
              setForm((f) => ({
                ...f,
                fromState: val,
                fromCity: "",
              }))
            }
            onCity={(val) =>
              setForm((f) => ({
                ...f,
                fromCity: val,
              }))
            }
            />
            
            {error && <p className="err">{error}</p>}
            
            {form.fromCity && (
              <button
              className="cta"
              style={{ marginTop: "18px" }}
              onClick={handleFromDone}
              >
              Continue <span className="cta-arr">→</span>
              </button>
            )}
            </>
          )}
          </div>
        )}
        
        {/* Q1 */}
        {q === 1 && (
          <div>
          <p className="bf" style={{ color: 'var(--teal)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '8px' }}>Day 1 planning</p>
          <h2 className="hf" style={{ color: 'var(--ink)', fontSize: 'clamp(24px,3.2vw,36px)', fontWeight: 700, lineHeight: 1.12, marginBottom: '8px' }}>When do you expect<br />to arrive?</h2>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '22px', fontWeight: 300 }}>We'll plan Day 1 around this — no over-scheduling.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ARRIVAL_OPTS.map(opt => (
            <button key={opt.value} className={`opt${form.arrivalTime === opt.value ? ' sel' : ''}`} onClick={() => handleArrival(opt.value)}>
            <span style={{ fontSize: '17px', minWidth: '22px', textAlign: 'center' }}>{opt.emoji}</span>
            <div><p className="bf" style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '14px' }}>{opt.label}</p><p className="bf" style={{ color: 'var(--muted)', fontSize: '12px' }}>{opt.hint}</p></div>
            </button>
          ))}
          </div>
          </div>
        )}
        
        {/* Q2 */}
        {q === 2 && (
          <div>
          <p className="bf" style={{ color: 'var(--teal)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '8px' }}>Your pace</p>
          <h2 className="hf" style={{ color: 'var(--ink)', fontSize: 'clamp(24px,3.2vw,36px)', fontWeight: 700, lineHeight: 1.12, marginBottom: '8px' }}>How's your energy<br />for this trip?</h2>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '22px', fontWeight: 300 }}>This changes how we pack each day.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ENERGY_OPTS.map(opt => (
            <button key={opt.value} className={`opt${form.energyLevel === opt.value ? ' sel' : ''}`} onClick={() => handleEnergy(opt.value)}>
            <span style={{ fontSize: '21px' }}>{opt.emoji}</span>
            <div><p className="bf" style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '14px' }}>{opt.label}</p><p className="bf" style={{ color: 'var(--muted)', fontSize: '12px' }}>{opt.hint}</p></div>
            </button>
          ))}
          </div>
          </div>
        )}
        
        {/* Q3 */}
        {q === 3 && (
          <div>
          <p className="bf" style={{ color: 'var(--teal)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '8px' }}>The destination</p>
          <h2 className="hf" style={{ color: 'var(--ink)', fontSize: 'clamp(24px,3.2vw,36px)', fontWeight: 700, lineHeight: 1.12, marginBottom: '8px' }}>Where are we going?</h2>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px', fontWeight: 300 }}>Select your destination below.</p>
          <LocationPicker
          label=""
          selectedCountry={form.destCountry} selectedState={form.destState} selectedCity={form.destCity}
          onCountry={c => setForm(f => ({ ...f, destCountry: c, destState: '', destCity: '' }))}
          onState={s => setForm(f => ({ ...f, destState: s, destCity: '' }))}
          onCity={c => setForm(f => ({ ...f, destCity: c }))}
          />
          {error && <p className="err">{error}</p>}
          {form.destCity && <button className="cta" style={{ marginTop: '18px' }} onClick={handleDestDone}>This way <span className="cta-arr">→</span></button>}
          </div>
        )}
        
        {/* Q4 */}
        {q === 4 && (
          <div>
          <p className="bf" style={{ color: 'var(--teal)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '8px' }}>Travel dates</p>
          <h2 className="hf" style={{ color: 'var(--ink)', fontSize: 'clamp(24px,3.2vw,36px)', fontWeight: 700, lineHeight: 1.12, marginBottom: '8px' }}>When are you<br />traveling?</h2>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '22px', fontWeight: 300 }}>Choose your travel dates. Up to 30 days.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>From</p>
          <input type="date" className="dinput" value={form.startDate} min={localToday}
          onChange={e => { setForm(f => ({ ...f, startDate: e.target.value, endDate: f.endDate <= e.target.value ? '' : f.endDate })); setError('') }} />
          </div>
          <div>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>To</p>
          <input type="date" className="dinput" value={form.endDate}
          min={form.startDate ? addDays(form.startDate, 1) : localToday}
          max={form.startDate ? addDays(form.startDate, 30) : ''}
          onChange={e => { setForm(f => ({ ...f, endDate: e.target.value })); setError('') }} />
          </div>
          </div>
          {tripDays > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="pill">
            <span className="bf" style={{ color: 'var(--teal-deep)', fontSize: '13px' }}>
            {tripDays} day{tripDays !== 1 ? 's' : ''}
            {form.startDate === localToday ? ' — starting today' : ''}
            </span>
            </div>
            
            <button
            onClick={handleDates}
            style={{
              background: '#1a1612',
              color: 'white',
              padding: '10px 22px',
              borderRadius: '999px',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              width: 'fit-content',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            >
            Continue →
            </button>
            </div>
          )}
          </div>
        )}
        
        {/* Q5 */}
        {q === 5 && (
          <div>
          <p className="bf" style={{ color: 'var(--teal)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '8px' }}>The crew & budget</p>
          <h2 className="hf" style={{ color: 'var(--ink)', fontSize: 'clamp(24px,3.2vw,36px)', fontWeight: 700, lineHeight: 1.12, marginBottom: '8px' }}>Who's coming?</h2>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '22px', fontWeight: 300 }}>Budget is optional.</p>
          <div style={{ marginBottom: '20px' }}>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Travelers</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <button key={n} className={`tnum${form.travelers === n ? ' sel' : ''}`} onClick={() => setForm(f => ({ ...f, travelers: n }))}>{n}</button>
          ))}
          </div>
          </div>
          <div>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Currency</p>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {CURRENCIES.map(c => <button key={c.code} className={`cur-btn${form.currency === c.code ? ' sel' : ''}`} onClick={() => setForm(f => ({ ...f, currency: c.code }))}>{c.symbol} {c.code}</button>)}
          </div>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Amount (optional)</p>
          <input className="ninput" type="number" placeholder={`e.g. ${currency.code === 'INR' ? '50000' : '2000'}`} min="0" max="1000000" value={form.budget}
          onChange={e => { setForm(f => ({ ...f, budget: e.target.value })); setError('') }} />
          </div>
          {budgetLow && <div style={{ marginTop: '9px', padding: '9px 13px', borderRadius: '9px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}><p className="bf" style={{ color: '#92400e', fontSize: '12px' }}>{currency.symbol}{budgetNum.toLocaleString()} for {form.travelers} traveler{form.travelers > 1 ? 's' : ''} is tight.</p></div>}
          {form.budget && !budgetLow && <p className="bf" style={{ color: 'rgba(26,22,18,0.3)', fontSize: '12px', marginTop: '6px' }}>{currency.symbol}{budgetNum.toLocaleString()} · {currency.symbol}{Math.round(perPerson).toLocaleString()} per person</p>}
          {error && <p className="err">{error}</p>}
          <button className="cta" style={{ marginTop: '18px' }} onClick={handleTravelersAndBudget}>Continue <span className="cta-arr">→</span></button>
          </div>
        )}
        
        {/* Q6 */}
        {q === 6 && (
          <div>
          <p className="bf" style={{ color: 'var(--teal)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '8px' }}>Purpose</p>
          <h2 className="hf" style={{ color: 'var(--ink)', fontSize: 'clamp(24px,3.2vw,36px)', fontWeight: 700, lineHeight: 1.12, marginBottom: '8px' }}>What kind of trip<br />is this?</h2>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '22px', fontWeight: 300 }}>This shapes activities, pace, and tone.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PURPOSE_OPTS.map(p => (
            <button key={p.value} className={`opt${form.tripPurpose === p.value ? ' sel' : ''}`} onClick={() => handlePurpose(p.value)}>
            <div><p className="bf" style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '14px' }}>{p.label}</p><p className="bf" style={{ color: 'var(--muted)', fontSize: '12px' }}>{p.hint}</p></div>
            </button>
          ))}
          </div>
          </div>
        )}
        
        {/* Q7 */}
        {q === 7 && (
          <div>
          <p className="bf" style={{ color: 'var(--teal)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '8px' }}>Interests</p>
          <h2 className="hf" style={{ color: 'var(--ink)', fontSize: 'clamp(24px,3.2vw,36px)', fontWeight: 700, lineHeight: 1.12, marginBottom: '8px' }}>What sounds fun<br />right now?</h2>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '18px', fontWeight: 300 }}>No wrong answer.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '16px' }}>
          {INTERESTS.map(int => (
            <button key={int.value} className={`chip${form.interests.includes(int.value) ? ' sel' : ''}`} onClick={() => toggleInterest(int.value)}>
            <span>{int.emoji}</span>{int.label}
            </button>
          ))}
          </div>
          {form.interests.length > 0 && <p className="bf" style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '12px' }}>{form.interests.length} selected</p>}
          {error && <p className="err">{error}</p>}
          <button className="cta" onClick={handleInterests}>Continue <span className="cta-arr">→</span></button>
          </div>
        )}
        
        {/* Q8 */}
        {q === 8 && (
          <div>
          <p className="bf" style={{ color: 'var(--teal)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '8px' }}>Planning style</p>
          <h2 className="hf" style={{ color: 'var(--ink)', fontSize: 'clamp(24px,3.2vw,36px)', fontWeight: 700, lineHeight: 1.12, marginBottom: '8px' }}>How structured do<br />you want the plan?</h2>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '22px', fontWeight: 300 }}>Controls itinerary density.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PLANNING_OPTS.map(p => (
            <button key={p.value} className={`opt${form.planningStyle === p.value ? ' sel' : ''}`} onClick={() => handlePlanningStyle(p.value)}>
            <div><p className="bf" style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '14px' }}>{p.label}</p><p className="bf" style={{ color: 'var(--muted)', fontSize: '12px' }}>{p.hint}</p></div>
            </button>
          ))}
          </div>
          </div>
        )}
        
        {/* Q9 */}
        {q === 9 && (
          <div>
          <p className="bf" style={{ color: 'var(--teal)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '8px' }}>Almost there</p>
          <h2 className="hf" style={{ color: 'var(--ink)', fontSize: 'clamp(24px,3.2vw,36px)', fontWeight: 700, lineHeight: 1.12, marginBottom: '8px' }}>
          How do you want<br />this trip to{' '}<em style={{ color: 'var(--teal)', fontWeight: 300 }}>feel?</em>
          </h2>
          <p className="bf" style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px', fontWeight: 300 }}>This shapes the overall tone.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {STYLES.map(s => (
            <button key={s.value} className={`opt${form.travelStyle === s.value ? ' sel' : ''}`} onClick={() => setForm(f => ({ ...f, travelStyle: s.value }))}>
            <span style={{ fontSize: '19px' }}>{s.emoji}</span>
            <div><p className="bf" style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '14px' }}>{s.label}</p><p className="bf" style={{ color: 'var(--muted)', fontSize: '12px' }}>{s.hint}</p></div>
            </button>
          ))}
          </div>
          {error && <p className="err">{error}</p>}
          {form.travelStyle && <button className="cta cta-teal" onClick={handleSubmit}>Build my itinerary <span className="cta-arr">→</span></button>}
          </div>
        )}
        
        </div>
        </div>
        </div>
        
        {/* ══ RIGHT PANEL ══ */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* Hero images — rotating when no destination picked */}
        {showingHero && HERO_IMAGES.map((h, i) => (
          <div key={i} className="bg-layer hero-fade" style={{
            backgroundImage: `url(${h.img})`,
            opacity: heroIdx === i ? 1 : 0,
            transition: 'opacity 1.2s ease',
          }} />
        ))}
        
        {/* Destination image */}
        {bgImg && (
          <div className="bg-layer" style={{ backgroundImage: `url(${bgImg})`, opacity: bgFade ? 0 : 1, transition: 'opacity 0.45s ease' }} />
        )}
        
        {/* Rich gradient overlay — always present, gives depth */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(26,22,18,0.05) 0%, rgba(26,22,18,0.15) 40%, rgba(26,22,18,0.72) 100%)',
          pointerEvents: 'none',
        }} />
        {/* Left fade for visual transition to form */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(250,248,244,0.22) 0%, transparent 25%)',
          pointerEvents: 'none',
        }} />
        
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 40px 48px' }}>
        
        {/* Destination label */}
        {rpLabel && bgImg && (
          <div style={{ marginBottom: '20px' }}>
          <p className="bf" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '5px' }}>{rpLabel}</p>
          {form.destCity && <h3 className="hf" style={{ color: 'white', fontSize: 'clamp(30px,3.5vw,48px)', fontWeight: 700, lineHeight: 1, textShadow: '0 2px 16px rgba(0,0,0,0.35)' }}>{form.destCity}</h3>}
          </div>
        )}
        
        {/* Hero label when rotating */}
        {showingHero && (
          <div style={{ marginBottom: '20px' }}>
          <p className="bf" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '5px' }}>Inspiration</p>
          <p className="hf" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '20px', fontStyle: 'italic', fontWeight: 300 }}>{heroLabel}</p>
          </div>
        )}
        
        {/* Summary card */}
        {(form.fromCity || form.alreadyThere || form.destCity || tripDays > 0 || (form.travelers > 0 && q >= 5)) && (
          <div style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '18px 20px' }}>
          <p className="bf" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Your trip so far</p>
          {(form.fromCity || form.alreadyThere) && (
            <div className="srow">
            <p className="bf" style={{ color: 'rgba(255,255,255,0.32)', fontSize: '10px', letterSpacing: '0.07em' }}>STARTING</p>
            <p className="bf" style={{ color: 'white', fontSize: '13px' }}>{form.alreadyThere ? 'Already at destination' : [form.fromCity, form.fromState, form.fromCountry].filter(Boolean).join(' → ')}</p>
            </div>
          )}
          {form.destCity && (
            <div className="srow">
            <p className="bf" style={{ color: 'rgba(255,255,255,0.32)', fontSize: '10px', letterSpacing: '0.07em' }}>DESTINATION</p>
            <p className="bf" style={{ color: 'white', fontSize: '13px' }}>{[form.destCity, form.destState, form.destCountry].filter(Boolean).join(' → ')}</p>
            </div>
          )}
          {tripDays > 0 && (
            <div className="srow">
            <p className="bf" style={{ color: 'rgba(255,255,255,0.32)', fontSize: '10px', letterSpacing: '0.07em' }}>DATES</p>
            <p className="bf" style={{ color: 'white', fontSize: '13px' }}>{form.startDate} → {form.endDate}</p>
            <p className="bf" style={{ color: '#2a9d8f', fontSize: '11px' }}>{tripDays} days</p>
            </div>
          )}
          {form.travelers > 0 && q >= 5 && (
            <div className="srow">
            <p className="bf" style={{ color: 'rgba(255,255,255,0.32)', fontSize: '10px', letterSpacing: '0.07em' }}>TRAVELERS</p>
            <p className="bf" style={{ color: 'white', fontSize: '13px' }}>{form.travelers === 1 ? 'Just you' : `${form.travelers} people`}</p>
            </div>
          )}
          {form.budget && (
            <div className="srow">
            <p className="bf" style={{ color: 'rgba(255,255,255,0.32)', fontSize: '10px', letterSpacing: '0.07em' }}>BUDGET</p>
            <p className="bf" style={{ color: 'white', fontSize: '13px' }}>{currency.symbol}{parseFloat(form.budget).toLocaleString()} {form.currency}</p>
            </div>
          )}
          {form.tripPurpose && (
            <div className="srow">
            <p className="bf" style={{ color: 'rgba(255,255,255,0.32)', fontSize: '10px', letterSpacing: '0.07em' }}>PURPOSE</p>
            <p className="bf" style={{ color: 'white', fontSize: '13px' }}>{PURPOSE_OPTS.find(p => p.value === form.tripPurpose)?.label}</p>
            </div>
          )}
          {form.interests.length > 0 && (
            <div className="srow">
            <p className="bf" style={{ color: 'rgba(255,255,255,0.32)', fontSize: '10px', letterSpacing: '0.07em' }}>INTERESTS</p>
            <p className="bf" style={{ color: 'white', fontSize: '13px' }}>{form.interests.map(i => INTERESTS.find(x => x.value === i)?.emoji).join('  ')}</p>
            </div>
          )}
          </div>
        )}
        </div>
        </div>
        
        {toast && <div className="toast">{toast}</div>}
        </div>
      )
    }
    