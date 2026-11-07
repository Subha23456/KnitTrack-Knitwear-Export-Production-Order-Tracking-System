import React, { useState } from 'react';
import { Order, ProductionStage, ColorBreakdown } from '../types';
import { createOrder } from '../services/api';
import { SafeImage } from './SafeImage';
import { X, Calendar, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface OrderSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (newOrder: Order) => void;
}

export const OrderSetupModal: React.FC<OrderSetupModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  if (!isOpen) return null;

  const [poNumber, setPoNumber] = useState<string>(`B-PO-${Math.floor(88300 + Math.random() * 500)}`);
  const [buyerId, setBuyerId] = useState<string>('buyer-b-uk');
  const [buyerName, setBuyerName] = useState<string>('Company B (UK)');
  const [styleDescription, setStyleDescription] = useState<string>("Men's waffle crew tee, forest green");
  const [productType, setProductType] = useState<string>('200 GSM 100% Combed Cotton');
  const [unit, setUnit] = useState<string>('Unit 1 (Kangeyam Rd)');
  const [orderDate, setOrderDate] = useState<string>('2026-11-06');
  const [exFactoryDate, setExFactoryDate] = useState<string>('2026-12-10');
  const [fobPriceINR, setFobPriceINR] = useState<number>(185);
  const [garmentImageUrl, setGarmentImageUrl] = useState<string>('/images/garment_navy_crew.jpg');

  // Color and size matrix
  const [colors, setColors] = useState<ColorBreakdown[]>([
    {
      colorName: 'Forest Green (PANTONE 19-5513)',
      hexCode: '#15803d',
      sizes: [
        { size: 'S', quantity: 2000 },
        { size: 'M', quantity: 3000 },
        { size: 'L', quantity: 3000 },
        { size: 'XL', quantity: 2000 },
      ],
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute total quantity
  const totalQuantity = colors.reduce((acc, c) => {
    return acc + c.sizes.reduce((sAcc, s) => sAcc + (Number(s.quantity) || 0), 0);
  }, 0);

  const totalOrderValue = totalQuantity * fobPriceINR;

  const handleSizeChange = (colorIndex: number, sizeIndex: number, newQty: number) => {
    const updated = [...colors];
    updated[colorIndex].sizes[sizeIndex].quantity = Math.max(0, newQty);
    setColors(updated);
  };

  const handleAddColor = () => {
    setColors([
      ...colors,
      {
        colorName: 'Optic White',
        hexCode: '#ffffff',
        sizes: [
          { size: 'S', quantity: 1000 },
          { size: 'M', quantity: 1500 },
          { size: 'L', quantity: 1500 },
          { size: 'XL', quantity: 1000 },
        ],
      },
    ]);
  };

  const handleRemoveColor = (index: number) => {
    if (colors.length <= 1) return;
    setColors(colors.filter((_, idx) => idx !== index));
  };

  const handleBuyerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bId = e.target.value;
    setBuyerId(bId);
    if (bId === 'buyer-b-uk') {
      setBuyerName('Company B (UK)');
      setPoNumber(`B-PO-${Math.floor(88300 + Math.random() * 500)}`);
    } else {
      setBuyerName('Company C (Germany)');
      setPoNumber(`C-PO-0${Math.floor(500 + Math.random() * 400)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalQuantity <= 0) {
      setErrorMsg('Please specify size quantities greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const newOrder = await createOrder({
        poNumber,
        buyerId,
        buyerName,
        styleDescription,
        productType,
        unit,
        orderDate,
        exFactoryDate,
        fobPricePerPieceINR: Number(fobPriceINR),
        totalQuantity,
        garmentImageUrl,
        colors,
      });

      onOrderCreated(newOrder);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full p-6 text-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Create New Production Export Order (PO Setup)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Includes colour & size breakdown matrix and automated TNA milestone scheduling.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Row 1: Buyer & PO Number & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                Buyer
              </label>
              <select
                aria-label="Buyer"
                value={buyerId}
                onChange={handleBuyerChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="buyer-b-uk">Company B (UK)</option>
                <option value="buyer-c-de">Company C (Germany)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                PO Number
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                required
                className="w-full font-mono bg-slate-50 border border-slate-300 rounded-md p-2 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                Manufacturing Unit
              </label>
              <select
                aria-label="Manufacturing Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="Unit 1 (Kangeyam Rd)">Unit 1 (Kangeyam Rd) - Tees & Basics</option>
                <option value="Unit 2 (Angeripalayam)">Unit 2 (Angeripalayam) - Polos & Collars</option>
                <option value="Unit 3 (Netaji Apparel Park)">Unit 3 (Netaji Apparel Park) - Kids Wear</option>
              </select>
            </div>
          </div>

          {/* Row 2: Style & Fabric */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                Style Description
              </label>
              <input
                type="text"
                value={styleDescription}
                onChange={(e) => setStyleDescription(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                Product & Fabric Specifications
              </label>
              <input
                type="text"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Dates & FOB Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                Order Placement Date
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                className="w-full font-mono bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                Ex-Factory Dispatch Date
              </label>
              <input
                type="date"
                value={exFactoryDate}
                onChange={(e) => setExFactoryDate(e.target.value)}
                required
                className="w-full font-mono bg-slate-50 border border-slate-300 rounded-md p-2 font-bold text-indigo-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                FOB Price Per Piece (INR ₹)
              </label>
              <input
                type="number"
                min="50"
                max="5000"
                value={fobPriceINR}
                onChange={(e) => setFobPriceINR(Number(e.target.value))}
                required
                className="w-full font-mono bg-slate-50 border border-slate-300 rounded-md p-2 font-bold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Garment Image Selection */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
              Garment Visual Reference
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'Navy Crew Tee', url: '/images/garment_navy_crew.jpg' },
                { label: 'White Polo', url: '/images/garment_white_polo.jpg' },
                { label: 'Kids Yellow Tee', url: '/images/garment_kids_yellow.jpg' },
              ].map((img) => (
                <button
                  type="button"
                  key={img.url}
                  onClick={() => setGarmentImageUrl(img.url)}
                  className={`flex items-center gap-1.5 p-1.5 rounded-md border text-[11px] transition-colors cursor-pointer ${
                    garmentImageUrl === img.url
                      ? 'border-slate-900 bg-slate-100 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <SafeImage
                    src={img.url}
                    alt={img.label}
                    className="w-7 h-7 rounded shrink-0"
                  />
                  <span>{img.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color & Size Matrix */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide">
                Colour & Size Quantities Breakdown (Pcs)
              </span>
              <button
                type="button"
                onClick={handleAddColor}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Colourway
              </button>
            </div>

            {colors.map((c, cIdx) => (
              <div key={cIdx} className="bg-white p-3 rounded border border-slate-200 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c.colorName}
                      onChange={(e) => {
                        const updated = [...colors];
                        updated[cIdx].colorName = e.target.value;
                        setColors(updated);
                      }}
                      className="text-xs font-semibold border-b border-slate-300 pb-0.5 focus:outline-none"
                    />
                  </div>
                  {colors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(cIdx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {c.sizes.map((s, sIdx) => (
                    <div key={s.size} className="text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Size {s.size}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={s.quantity}
                        onChange={(e) => handleSizeChange(cIdx, sIdx, Number(e.target.value))}
                        className="w-full text-center font-mono text-xs font-bold bg-slate-50 border border-slate-200 rounded p-1 text-slate-900 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Matrix Summary Strip */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-mono text-xs">
              <span className="font-semibold text-slate-700">Total Pieces:</span>
              <span className="text-sm font-bold text-slate-900">
                {totalQuantity.toLocaleString()} pcs
              </span>
              <span className="font-semibold text-slate-700 ml-4">Total Order Value:</span>
              <span className="text-sm font-bold text-emerald-700">
                ₹{totalOrderValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Automated TNA Template preview note */}
          <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center justify-between text-slate-700">
            <div>
              <span className="font-bold text-indigo-950 block">Automated TNA Milestone Template</span>
              <span className="text-[11px] text-slate-500">
                8 milestones (Fabric, Cutting, Printing, Stitching, Washing, Finishing, QC, Packing) will be automatically scheduled between {orderDate} and {exFactoryDate}.
              </span>
            </div>
            <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalQuantity <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Order...' : 'Confirm & Generate TNA Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
