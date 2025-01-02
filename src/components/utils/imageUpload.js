import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
// Fonction pour télécharger l'image et obtenir l'URL
export const uploadProfileImage = (profileImage, storage, formData, userRef) => {
  return new Promise((resolve, reject) => {
    if (!profileImage) {
      resolve(null); // Aucune image à télécharger
    }

    const storageRef = ref(storage, `profile_images/${profileImage.name}`);
    const uploadTask = uploadBytesResumable(storageRef, profileImage);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        reject('Erreur lors du téléchargement de l\'image', error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await updateDoc(userRef, {
          ...formData,
          profileImageURL: downloadURL,
        });
        resolve(downloadURL);
      }
    );
  });
};