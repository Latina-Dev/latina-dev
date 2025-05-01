import styles from './Map.module.css';

const Map = () => {
  return (
    <div className={styles.mapContainer}>
      <h2 className={styles.mapTitle}>Heritage Locations</h2>
        <iframe 
          width="800"
          height="450"
          src="https://www.arcgis.com/apps/Embed/index.html?webmap=44c363b573074671a9b668e9db58310a&zoom=true&previewImage=false&scale=true&disable_scroll=true&theme=light&disable_popup=true">
      </iframe>
    </div>
  );
};

export default Map;