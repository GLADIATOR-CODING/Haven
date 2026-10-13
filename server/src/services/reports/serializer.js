/**
 * publicView: Sanitizes a report document for member-facing or public views.
 *
 * Rules:
 * 1. privateDetails is ALWAYS stripped.
 * 2. Sensitive category photos are masked in public/feed/member views until verified/handed over.
 */
export function publicView(report, categoryConfig = null) {
  if (!report) return null;

  // Convert Mongoose document to plain object if needed
  const doc = typeof report.toObject === 'function' ? report.toObject() : { ...report };

  // 1. Strictly remove private verification details
  delete doc.privateDetails;

  // 2. Determine if category is marked sensitive
  const isSensitive = categoryConfig ? categoryConfig.sensitive : false;

  // 3. If category is sensitive and item is not yet handed over, mask photo URL from members
  if (isSensitive && doc.type === 'found' && doc.status !== 'handed_over') {
    doc.photoMasked = true;
    doc.photo = {
      url: '',
      publicId: '',
      isSensitiveMasked: true,
    };
  } else {
    doc.photoMasked = false;
  }

  return {
    id: doc._id || doc.id,
    orgId: doc.orgId,
    type: doc.type,
    status: doc.status,
    reporterId: doc.reporterId,
    category: doc.category,
    title: doc.title,
    description: doc.description,
    colors: doc.colors || [],
    brand: doc.brand || '',
    location: doc.location,
    locationNote: doc.locationNote || '',
    occurredFrom: doc.occurredFrom,
    occurredTo: doc.occurredTo,
    photo: doc.photo,
    photoMasked: doc.photoMasked,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
