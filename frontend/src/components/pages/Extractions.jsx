import { useEffect, useMemo, useState } from 'react';
import ExtractionsController from './controllers/ExtractionsController.jsx';
import ExtractionsHelper from './helpers/ExtractionsHelper.jsx';

function Extractions() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const view = useMemo(
    () => ExtractionsController.build(setData, setError, setLoading),
    []
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(view.buildEffect(), []);

  if (loading) return ExtractionsHelper.renderLoading();
  if (error) return ExtractionsHelper.renderError(error);

  return ExtractionsHelper.render(data);
}

export default Extractions;
