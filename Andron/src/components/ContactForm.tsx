"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { getImagePath } from "@/utils/imagePath";

const ContactForm = ({ isContactPage = false }) => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ code: "+90", countryCode: "tr", name: "Turkey" });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    topic: "",
    company: "",
    where: "",
    email: "",
    phone: "",
    message: "",
    newsletter: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  // Form validation
  const isFormValid = () => {
    return (
      formData.topic.trim() !== "" &&
      formData.company.trim() !== "" &&
      formData.where.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.phone.trim() !== "" &&
      formData.message.trim() !== "" &&
      privacyAccepted
    );
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setSubmitStatus({ type: "error", message: "Please fill in all required fields and accept the privacy policy." });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const fullPhone = `${selectedCountry.code} ${formData.phone}`;
      
      // Production'da basePath '/home' olduğu için API path'ini dinamik olarak belirle
      // window.location.pathname'i kontrol ederek basePath'i belirle
      const getBasePath = () => {
        if (typeof window !== 'undefined') {
          // Eğer pathname '/home' ile başlıyorsa basePath var
          return window.location.pathname.startsWith('/home') ? '/home' : '';
        }
        return '';
      };
      const basePath = getBasePath();
      const apiUrl = `${basePath}/api/contact`;
      
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: formData.topic,
          company: formData.company,
          where: formData.where,
          email: formData.email,
          phone: fullPhone,
          message: formData.message,
          newsletter: formData.newsletter,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus({ type: "success", message: "Your request has been received. We will contact you as soon as possible." });
        // Reset form
        setFormData({
          topic: "",
          company: "",
          where: "",
          email: "",
          phone: "",
          message: "",
          newsletter: false,
        });
        setPrivacyAccepted(false);
      } else {
        setSubmitStatus({ type: "error", message: data.message || "Failed to send message. Please try again." });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitStatus({ type: "error", message: "An error occurred. Please try again later." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const countries = [
    { code: "+93", countryCode: "af", name: "Afghanistan" },
    { code: "+355", countryCode: "al", name: "Albania" },
    { code: "+213", countryCode: "dz", name: "Algeria" },
    { code: "+376", countryCode: "ad", name: "Andorra" },
    { code: "+244", countryCode: "ao", name: "Angola" },
    { code: "+1", countryCode: "ag", name: "Antigua and Barbuda" },
    { code: "+54", countryCode: "ar", name: "Argentina" },
    { code: "+374", countryCode: "am", name: "Armenia" },
    { code: "+61", countryCode: "au", name: "Australia" },
    { code: "+43", countryCode: "at", name: "Austria" },
    { code: "+994", countryCode: "az", name: "Azerbaijan" },
    { code: "+1", countryCode: "bs", name: "Bahamas" },
    { code: "+973", countryCode: "bh", name: "Bahrain" },
    { code: "+880", countryCode: "bd", name: "Bangladesh" },
    { code: "+1", countryCode: "bb", name: "Barbados" },
    { code: "+375", countryCode: "by", name: "Belarus" },
    { code: "+32", countryCode: "be", name: "Belgium" },
    { code: "+501", countryCode: "bz", name: "Belize" },
    { code: "+229", countryCode: "bj", name: "Benin" },
    { code: "+975", countryCode: "bt", name: "Bhutan" },
    { code: "+591", countryCode: "bo", name: "Bolivia" },
    { code: "+387", countryCode: "ba", name: "Bosnia and Herzegovina" },
    { code: "+267", countryCode: "bw", name: "Botswana" },
    { code: "+55", countryCode: "br", name: "Brazil" },
    { code: "+673", countryCode: "bn", name: "Brunei" },
    { code: "+359", countryCode: "bg", name: "Bulgaria" },
    { code: "+226", countryCode: "bf", name: "Burkina Faso" },
    { code: "+257", countryCode: "bi", name: "Burundi" },
    { code: "+855", countryCode: "kh", name: "Cambodia" },
    { code: "+237", countryCode: "cm", name: "Cameroon" },
    { code: "+1", countryCode: "ca", name: "Canada" },
    { code: "+238", countryCode: "cv", name: "Cape Verde" },
    { code: "+236", countryCode: "cf", name: "Central African Republic" },
    { code: "+235", countryCode: "td", name: "Chad" },
    { code: "+56", countryCode: "cl", name: "Chile" },
    { code: "+86", countryCode: "cn", name: "China" },
    { code: "+57", countryCode: "co", name: "Colombia" },
    { code: "+269", countryCode: "km", name: "Comoros" },
    { code: "+242", countryCode: "cg", name: "Congo" },
    { code: "+506", countryCode: "cr", name: "Costa Rica" },
    { code: "+385", countryCode: "hr", name: "Croatia" },
    { code: "+53", countryCode: "cu", name: "Cuba" },
    { code: "+357", countryCode: "cy", name: "Cyprus" },
    { code: "+420", countryCode: "cz", name: "Czech Republic" },
    { code: "+45", countryCode: "dk", name: "Denmark" },
    { code: "+253", countryCode: "dj", name: "Djibouti" },
    { code: "+1", countryCode: "dm", name: "Dominica" },
    { code: "+1", countryCode: "do", name: "Dominican Republic" },
    { code: "+593", countryCode: "ec", name: "Ecuador" },
    { code: "+20", countryCode: "eg", name: "Egypt" },
    { code: "+503", countryCode: "sv", name: "El Salvador" },
    { code: "+240", countryCode: "gq", name: "Equatorial Guinea" },
    { code: "+291", countryCode: "er", name: "Eritrea" },
    { code: "+372", countryCode: "ee", name: "Estonia" },
    { code: "+251", countryCode: "et", name: "Ethiopia" },
    { code: "+679", countryCode: "fj", name: "Fiji" },
    { code: "+358", countryCode: "fi", name: "Finland" },
    { code: "+33", countryCode: "fr", name: "France" },
    { code: "+241", countryCode: "ga", name: "Gabon" },
    { code: "+220", countryCode: "gm", name: "Gambia" },
    { code: "+995", countryCode: "ge", name: "Georgia" },
    { code: "+49", countryCode: "de", name: "Germany" },
    { code: "+233", countryCode: "gh", name: "Ghana" },
    { code: "+30", countryCode: "gr", name: "Greece" },
    { code: "+1", countryCode: "gd", name: "Grenada" },
    { code: "+502", countryCode: "gt", name: "Guatemala" },
    { code: "+224", countryCode: "gn", name: "Guinea" },
    { code: "+245", countryCode: "gw", name: "Guinea-Bissau" },
    { code: "+592", countryCode: "gy", name: "Guyana" },
    { code: "+509", countryCode: "ht", name: "Haiti" },
    { code: "+504", countryCode: "hn", name: "Honduras" },
    { code: "+852", countryCode: "hk", name: "Hong Kong" },
    { code: "+36", countryCode: "hu", name: "Hungary" },
    { code: "+354", countryCode: "is", name: "Iceland" },
    { code: "+91", countryCode: "in", name: "India" },
    { code: "+62", countryCode: "id", name: "Indonesia" },
    { code: "+98", countryCode: "ir", name: "Iran" },
    { code: "+964", countryCode: "iq", name: "Iraq" },
    { code: "+353", countryCode: "ie", name: "Ireland" },
    { code: "+972", countryCode: "il", name: "Israel" },
    { code: "+39", countryCode: "it", name: "Italy" },
    { code: "+1", countryCode: "jm", name: "Jamaica" },
    { code: "+81", countryCode: "jp", name: "Japan" },
    { code: "+962", countryCode: "jo", name: "Jordan" },
    { code: "+7", countryCode: "kz", name: "Kazakhstan" },
    { code: "+254", countryCode: "ke", name: "Kenya" },
    { code: "+686", countryCode: "ki", name: "Kiribati" },
    { code: "+965", countryCode: "kw", name: "Kuwait" },
    { code: "+996", countryCode: "kg", name: "Kyrgyzstan" },
    { code: "+856", countryCode: "la", name: "Laos" },
    { code: "+371", countryCode: "lv", name: "Latvia" },
    { code: "+961", countryCode: "lb", name: "Lebanon" },
    { code: "+266", countryCode: "ls", name: "Lesotho" },
    { code: "+231", countryCode: "lr", name: "Liberia" },
    { code: "+218", countryCode: "ly", name: "Libya" },
    { code: "+423", countryCode: "li", name: "Liechtenstein" },
    { code: "+370", countryCode: "lt", name: "Lithuania" },
    { code: "+352", countryCode: "lu", name: "Luxembourg" },
    { code: "+853", countryCode: "mo", name: "Macau" },
    { code: "+389", countryCode: "mk", name: "North Macedonia" },
    { code: "+261", countryCode: "mg", name: "Madagascar" },
    { code: "+265", countryCode: "mw", name: "Malawi" },
    { code: "+60", countryCode: "my", name: "Malaysia" },
    { code: "+960", countryCode: "mv", name: "Maldives" },
    { code: "+223", countryCode: "ml", name: "Mali" },
    { code: "+356", countryCode: "mt", name: "Malta" },
    { code: "+692", countryCode: "mh", name: "Marshall Islands" },
    { code: "+222", countryCode: "mr", name: "Mauritania" },
    { code: "+230", countryCode: "mu", name: "Mauritius" },
    { code: "+52", countryCode: "mx", name: "Mexico" },
    { code: "+691", countryCode: "fm", name: "Micronesia" },
    { code: "+373", countryCode: "md", name: "Moldova" },
    { code: "+377", countryCode: "mc", name: "Monaco" },
    { code: "+976", countryCode: "mn", name: "Mongolia" },
    { code: "+382", countryCode: "me", name: "Montenegro" },
    { code: "+212", countryCode: "ma", name: "Morocco" },
    { code: "+258", countryCode: "mz", name: "Mozambique" },
    { code: "+95", countryCode: "mm", name: "Myanmar" },
    { code: "+264", countryCode: "na", name: "Namibia" },
    { code: "+674", countryCode: "nr", name: "Nauru" },
    { code: "+977", countryCode: "np", name: "Nepal" },
    { code: "+31", countryCode: "nl", name: "Netherlands" },
    { code: "+64", countryCode: "nz", name: "New Zealand" },
    { code: "+505", countryCode: "ni", name: "Nicaragua" },
    { code: "+227", countryCode: "ne", name: "Niger" },
    { code: "+234", countryCode: "ng", name: "Nigeria" },
    { code: "+850", countryCode: "kp", name: "North Korea" },
    { code: "+47", countryCode: "no", name: "Norway" },
    { code: "+968", countryCode: "om", name: "Oman" },
    { code: "+92", countryCode: "pk", name: "Pakistan" },
    { code: "+680", countryCode: "pw", name: "Palau" },
    { code: "+970", countryCode: "ps", name: "Palestine" },
    { code: "+507", countryCode: "pa", name: "Panama" },
    { code: "+675", countryCode: "pg", name: "Papua New Guinea" },
    { code: "+595", countryCode: "py", name: "Paraguay" },
    { code: "+51", countryCode: "pe", name: "Peru" },
    { code: "+63", countryCode: "ph", name: "Philippines" },
    { code: "+48", countryCode: "pl", name: "Poland" },
    { code: "+351", countryCode: "pt", name: "Portugal" },
    { code: "+974", countryCode: "qa", name: "Qatar" },
    { code: "+40", countryCode: "ro", name: "Romania" },
    { code: "+7", countryCode: "ru", name: "Russia" },
    { code: "+250", countryCode: "rw", name: "Rwanda" },
    { code: "+1", countryCode: "kn", name: "Saint Kitts and Nevis" },
    { code: "+1", countryCode: "lc", name: "Saint Lucia" },
    { code: "+1", countryCode: "vc", name: "Saint Vincent" },
    { code: "+685", countryCode: "ws", name: "Samoa" },
    { code: "+378", countryCode: "sm", name: "San Marino" },
    { code: "+239", countryCode: "st", name: "Sao Tome and Principe" },
    { code: "+966", countryCode: "sa", name: "Saudi Arabia" },
    { code: "+221", countryCode: "sn", name: "Senegal" },
    { code: "+381", countryCode: "rs", name: "Serbia" },
    { code: "+248", countryCode: "sc", name: "Seychelles" },
    { code: "+232", countryCode: "sl", name: "Sierra Leone" },
    { code: "+65", countryCode: "sg", name: "Singapore" },
    { code: "+421", countryCode: "sk", name: "Slovakia" },
    { code: "+386", countryCode: "si", name: "Slovenia" },
    { code: "+677", countryCode: "sb", name: "Solomon Islands" },
    { code: "+252", countryCode: "so", name: "Somalia" },
    { code: "+27", countryCode: "za", name: "South Africa" },
    { code: "+82", countryCode: "kr", name: "South Korea" },
    { code: "+211", countryCode: "ss", name: "South Sudan" },
    { code: "+34", countryCode: "es", name: "Spain" },
    { code: "+94", countryCode: "lk", name: "Sri Lanka" },
    { code: "+249", countryCode: "sd", name: "Sudan" },
    { code: "+597", countryCode: "sr", name: "Suriname" },
    { code: "+268", countryCode: "sz", name: "Eswatini" },
    { code: "+46", countryCode: "se", name: "Sweden" },
    { code: "+41", countryCode: "ch", name: "Switzerland" },
    { code: "+963", countryCode: "sy", name: "Syria" },
    { code: "+886", countryCode: "tw", name: "Taiwan" },
    { code: "+992", countryCode: "tj", name: "Tajikistan" },
    { code: "+255", countryCode: "tz", name: "Tanzania" },
    { code: "+66", countryCode: "th", name: "Thailand" },
    { code: "+228", countryCode: "tg", name: "Togo" },
    { code: "+676", countryCode: "to", name: "Tonga" },
    { code: "+1", countryCode: "tt", name: "Trinidad and Tobago" },
    { code: "+216", countryCode: "tn", name: "Tunisia" },
    { code: "+90", countryCode: "tr", name: "Turkey" },
    { code: "+993", countryCode: "tm", name: "Turkmenistan" },
    { code: "+1", countryCode: "tv", name: "Tuvalu" },
    { code: "+256", countryCode: "ug", name: "Uganda" },
    { code: "+380", countryCode: "ua", name: "Ukraine" },
    { code: "+971", countryCode: "ae", name: "UAE" },
    { code: "+44", countryCode: "gb", name: "United Kingdom" },
    { code: "+1", countryCode: "us", name: "United States" },
    { code: "+598", countryCode: "uy", name: "Uruguay" },
    { code: "+998", countryCode: "uz", name: "Uzbekistan" },
    { code: "+678", countryCode: "vu", name: "Vanuatu" },
    { code: "+379", countryCode: "va", name: "Vatican City" },
    { code: "+58", countryCode: "ve", name: "Venezuela" },
    { code: "+84", countryCode: "vn", name: "Vietnam" },
    { code: "+967", countryCode: "ye", name: "Yemen" },
    { code: "+260", countryCode: "zm", name: "Zambia" },
    { code: "+263", countryCode: "zw", name: "Zimbabwe" },
  ];

  return (
    <section className="bg-gray-50 w-full py-16 text-center">
      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(33, 37, 41, 0.55)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl max-w-5xl w-full max-h-[80vh] shadow-2xl flex flex-col"
          >
            {/* Header - Fixed */}
            <div className="p-6 pb-4">
              <h2 className="text-[32px] leading-[96px] font-bold text-center text-black">
                PRIVACY POLICY AND PERSONAL DATA PROTECTION
              </h2>
              <div className="w-50 h-1 bg-blue-500 mx-auto"></div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 pb-4 relative">
              <div className="text-left space-y-8">
                {/* KVKK Terms Section */}
                <div>
                  <h3
                    className="text-[18px] font-semibold mb-4"
                    style={{ color: "#000000" }}
                  >
                    GENERAL DISCLOSURE NOTICE ON THE PROTECTION OF PERSONAL DATA UNDER LAW NO. 6698
                  </h3>
                  <div className="space-y-4">
                    <p
                      className="text-[18px] leading-relaxed"
                      style={{ color: "#525E6F" }}
                    >
                      As ANDRON GAME OYUN JOINT STOCK COMPANY (ANDRON Game / the &quot;Company&quot;), we attach great importance to the protection of personal data belonging to our customers, product and service suppliers, employees, employee candidates, visitors, and other third parties.
                    </p>
                    <p
                      className="text-[18px] leading-relaxed"
                      style={{ color: "#525E6F" }}
                    >
                      In our capacity as Data Controller, we process the personal data under our responsibility within the limits stipulated by Law No. 6698 on the Protection of Personal Data (KVKK), in accordance with the law and the principles of integrity and good faith.
                    </p>

                    <h3
                      className="text-[18px] font-bold mb-3 mt-6"
                      style={{ color: "#000000" }}
                    >
                      Processed Personal Data and Special Categories of Personal Data
                    </h3>
                    <p
                      className="text-[18px] leading-relaxed mb-4"
                      style={{ color: "#525E6F" }}
                    >
                      The following types of personal and special category personal data are processed by ANDRON Game:
                    </p>

                    <h4
                      className="text-[16px] font-semibold mb-3 mt-4"
                      style={{ color: "#000000" }}
                    >
                      PERSONAL DATA
                    </h4>
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                          <tr style={{ backgroundColor: "#f5f5f5" }}>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ color: "#000000" }}>Data Type</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ color: "#000000" }}>Collected Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Identity</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>Name-surname, Turkish ID number, information contained in national ID and driver&apos;s license, signature specimen, and other identification information.</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Contact</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>Telephone number, address, email address, business address, contact person information, and other contact-related data.</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Location</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>Location and route information of employees using company vehicles.</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Personnel File</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>Duration of employment, salary, work-related details, SGK registration number, etc.</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Legal Transaction</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>Personal data contained in litigation files opened by or against the Company, or included in correspondence with judicial authorities.</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Customer Transaction</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>Invoice information related to individual customers, etc.</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Finance</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>Bank account details, debt causes and amounts, insurance registration number, tax ID number, etc.</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Risk Management</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>Data processed for managing commercial, technical, or administrative risks.</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Professional Experience</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>Education details, foreign language proficiency, work experience, driving license, profession, academic background, references, motivations, skills, tendencies, qualifications, interests, workplace behaviors, and psychometric assessments.</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Transaction Security</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>IP address, website access logs, username and password details, cookies, etc.</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Marketing</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>Cookie (browser) records and related analytics.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h4
                      className="text-[16px] font-semibold mb-3 mt-4"
                      style={{ color: "#000000" }}
                    >
                      SPECIAL CATEGORIES OF PERSONAL DATA
                    </h4>
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                          <tr style={{ backgroundColor: "#f5f5f5" }}>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ color: "#000000" }}>Data Type</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ color: "#000000" }}>Collected Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Health Information</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>Health data belonging to employees and interns.</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 font-semibold" style={{ color: "#000000" }}>Criminal Convictions and Security Measures</td>
                            <td className="border border-gray-300 px-3 py-2" style={{ color: "#525E6F" }}>Criminal record information of employees and job applicants.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h3
                      className="text-[18px] font-bold mb-3 mt-6"
                      style={{ color: "#000000" }}
                    >
                      Purposes of Processing Personal and Special Category Personal Data
                    </h3>
                    <p
                      className="text-[18px] leading-relaxed mb-4"
                      style={{ color: "#525E6F" }}
                    >
                      ANDRON Game processes the above-mentioned personal data for the following purposes:
                    </p>
                    <ul className="list-disc list-inside space-y-2 mb-6" style={{ color: "#525E6F" }}>
                      <li>Conducting Emergency Management Processes</li>
                      <li>Executing Information Security Processes</li>
                      <li>Managing Employee / Intern / Student Recruitment and Placement Processes</li>
                      <li>Handling Job Application Processes</li>
                      <li>Fulfilling Contractual and Statutory Obligations for Employees</li>
                      <li>Conducting Audit and Ethical Compliance Activities</li>
                      <li>Organizing Training Activities</li>
                      <li>Ensuring Compliance with Applicable Legislation</li>
                      <li>Managing Financial and Accounting Transactions</li>
                      <li>Ensuring Physical Premises Security</li>
                      <li>Managing Assignment and Delegation Processes</li>
                      <li>Conducting Legal Affairs</li>
                      <li>Carrying Out Internal Audit, Investigation, and Intelligence Activities</li>
                      <li>Executing Communication Processes</li>
                      <li>Planning Human Resources Processes</li>
                      <li>Conducting and Supervising Business Activities</li>
                      <li>Managing Occupational Health and Safety Processes</li>
                      <li>Gathering and Evaluating Improvement Suggestions</li>
                      <li>Ensuring Business Continuity</li>
                      <li>Managing Procurement Processes</li>
                      <li>Conducting After-Sales Support Services</li>
                      <li>Managing Sales Processes</li>
                      <li>Managing Customer Relationship Processes</li>
                      <li>Organizing Corporate Events and Activities</li>
                      <li>Conducting Marketing and Analytical Studies</li>
                      <li>Managing Advertisement, Campaign, and Promotion Activities</li>
                      <li>Conducting Risk Management Processes</li>
                      <li>Executing Contractual Processes</li>
                      <li>Ensuring Security of Movable Assets and Resources</li>
                      <li>Managing Payroll and Compensation Policies</li>
                      <li>Providing Information to Authorized Persons, Institutions, and Authorities</li>
                      <li>Managing Corporate Governance and Administrative Processes</li>
                      <li>Recording and Monitoring Visitor Information</li>
                    </ul>

                    <h3
                      className="text-[18px] font-bold mb-3 mt-6"
                      style={{ color: "#000000" }}
                    >
                      Collection Method and Legal Basis for Processing Personal Data
                    </h3>
                    <p
                      className="text-[18px] leading-relaxed mb-4"
                      style={{ color: "#525E6F" }}
                    >
                      ANDRON Game processes personal and special category personal data under the conditions specified in Article 5 of Law No. 6698, including:
                    </p>
                    <ul className="list-disc list-inside space-y-2 mb-4" style={{ color: "#525E6F" }}>
                      <li>explicit legal provisions,</li>
                      <li>establishment or performance of a contract,</li>
                      <li>fulfillment of legal obligations of the data controller,</li>
                      <li>necessity for the establishment, exercise, or protection of a legal right,</li>
                      <li>public disclosure by the data subject,</li>
                      <li>legitimate interests of the data controller, provided that it does not harm the fundamental rights and freedoms of the data subject, and</li>
                      <li>explicit consent where required.</li>
                    </ul>
                    <p
                      className="text-[18px] leading-relaxed mb-6"
                      style={{ color: "#525E6F" }}
                    >
                      Data may be collected through job application forms, documents submitted to the Company, HR and accounting records, invoices, delivery notes, quotations, correspondence via post or email, business partners, customers (companies to which you have applied), global platforms, and website visits.
                    </p>

                    <h3
                      className="text-[18px] font-bold mb-3 mt-6"
                      style={{ color: "#000000" }}
                    >
                      Sharing of Personal Data with Third Parties in Turkey
                    </h3>
                    <p
                      className="text-[18px] leading-relaxed mb-4"
                      style={{ color: "#525E6F" }}
                    >
                      ANDRON Game may share personal data, within the legal grounds specified in Article 8 of Law No. 6698, with:
                    </p>
                    <ul className="list-disc list-inside space-y-2 mb-6" style={{ color: "#525E6F" }}>
                      <li>Authorized public institutions and organizations as required by law,</li>
                      <li>Group companies operating in the same sector (only where necessary),</li>
                      <li>Banks (for processing employee salary payments, including name, surname, and IBAN information),</li>
                      <li>Certified public accountants (for payroll and financial transactions),</li>
                      <li>Attorneys (for potential legal disputes involving identity, contact, or legal data),</li>
                      <li>Contracted physicians (for health-related special category data).</li>
                    </ul>

                    <h3
                      className="text-[18px] font-bold mb-3 mt-6"
                      style={{ color: "#000000" }}
                    >
                      Sharing of Personal Data with Third Parties Abroad
                    </h3>
                    <p
                      className="text-[18px] leading-relaxed mb-4"
                      style={{ color: "#525E6F" }}
                    >
                      ANDRON Game may share personal data with third parties abroad solely for the purpose of processing job applications, under the legal bases of Article 9 of Law No. 6698.
                    </p>
                    <p
                      className="text-[18px] leading-relaxed mb-4"
                      style={{ color: "#525E6F" }}
                    >
                      Personal data are securely stored on Microsoft Azure Cloud Systems, which are hosted abroad but inaccessible to unauthorized third parties.
                    </p>
                    <p
                      className="text-[18px] leading-relaxed mb-6"
                      style={{ color: "#525E6F" }}
                    >
                      For users of ANDRON Game&apos;s global online platforms, personal data may be transferred abroad with explicit consent, in cases where third-party integrated services are utilized.
                    </p>

                    <h3
                      className="text-[18px] font-bold mb-3 mt-6"
                      style={{ color: "#000000" }}
                    >
                      Rights of Data Subjects Regarding Their Personal Data
                    </h3>
                    <p
                      className="text-[18px] leading-relaxed mb-4"
                      style={{ color: "#525E6F" }}
                    >
                      Individuals whose personal data are processed by ANDRON Game are entitled to all rights listed in Article 11 of the Law No. 6698, including the right to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 mb-6" style={{ color: "#525E6F" }}>
                      <li>Learn whether their personal data are processed,</li>
                      <li>Request information regarding such processing,</li>
                      <li>Learn the purpose of processing and whether data are used accordingly,</li>
                      <li>Learn the domestic or international third parties to whom personal data are disclosed,</li>
                      <li>Request correction of incomplete or inaccurate data,</li>
                      <li>Request deletion or destruction of personal data,</li>
                      <li>Request notification of correction, deletion, or destruction to third parties to whom data have been disclosed,</li>
                      <li>Object to results arising from automated data processing, and</li>
                      <li>Request compensation for damages incurred due to unlawful processing of personal data.</li>
                    </ul>

                    <h3
                      className="text-[18px] font-bold mb-3 mt-6"
                      style={{ color: "#000000" }}
                    >
                      Requests Regarding Your Personal Data
                    </h3>
                    <p
                      className="text-[18px] leading-relaxed mb-4"
                      style={{ color: "#525E6F" }}
                    >
                      Pursuant to Articles 11 and 13 of Law No. 6698 and Article 5 of the Communiqué on Application Procedures to Data Controllers, you may submit your requests regarding your rights to ANDRON Game using the official Data Subject Application Form (ANDRON GAME KVKK Form) available on our website (www.androngame.com.tr) or in person at our headquarters.
                    </p>
                    <p
                      className="text-[18px] leading-relaxed mb-4"
                      style={{ color: "#525E6F" }}
                    >
                      Applications must include identity verification documents and contain the following information:
                    </p>
                    <p
                      className="text-[18px] leading-relaxed mb-4"
                      style={{ color: "#525E6F" }}
                    >
                      full name, signature (if written), Turkish ID number, residential or workplace address for notification, electronic mail address (if available), phone and fax number (if any), and a clear statement of the request.
                    </p>
                    <p
                      className="text-[18px] leading-relaxed mb-4"
                      style={{ color: "#525E6F" }}
                    >
                      Requests will be processed free of charge within 30 days, unless an additional cost arises, in which case a fee determined by the Communiqué may be requested.
                    </p>
                    <p
                      className="text-[18px] leading-relaxed"
                      style={{ color: "#525E6F" }}
                    >
                      Applications with unverifiable identity documentation will not be processed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Aşağı hissədən kölgə, yalnız kontent scroll oluna biləndə görünsün */}
              <div
                className="pointer-events-none"
                style={{
                  position: "sticky",
                  left: 0,
                  right: 0,
                  bottom: -20,
                  height: "50px",
                  zIndex: 10,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.10) 60%, rgba(255,255,255,0) 100%)",
                }}
              />
            </div>

            {/* Footer - Fixed */}
            <div className="p-6 pt-4">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="w-[196px] h-[45px] border border-[#0099FF] text-[#0099FF] bg-white rounded-md hover:bg-blue-50 transition-colors font-bold text-base"
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  BACK
                </button>
                <button
                  onClick={() => {
                    setPrivacyAccepted(true);
                    setShowTermsModal(false);
                  }}
                  className="w-[196px] h-[45px] bg-[#0099FF] text-white rounded-md hover:bg-blue-600 transition-colors font-bold text-base"
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  I HAVE READ AND UNDERSTOOD
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        viewport={{ once: true }}
        className="text-[32px] font-bold mb-2 text-[#222]"
      >
        CONTACT
      </motion.h2>
      <div className="w-40 h-[4px] bg-[#0099FF] mx-auto mb-6 rounded" />
      <motion.h3
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="text-[64px] font-extrabold text-[#222]"
        style={{
          backgroundImage:
            "linear-gradient(to right,rgb(0, 153, 255), rgb(0, 153, 255, 0.5))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Get in touch
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
        className="text-[#000]  mx-auto mb-12 px-4 font-[500] font-inter text-[14px]"
      >
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry.
      </motion.p>
      <div
        className="flex flex-col md:flex-row rounded-[20px] border-[2px] border-solid border-black/[0.05] p-12 pb-20 justify-center gap-12 items-stretch m-auto max-w-6xl"
        style={{
          backdropFilter: "blur(380px)",
          background: "#E8F6FF",
        }}
      >
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="w-full max-w-md text-left flex flex-col justify-between shrink-0 grow-1"
          id="contact-form"
        >
          <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="topic"
              className="block text-[#525659] text-sm font-semibold mb-2"
            >
              How Can We Help You?
            </label>
            <div className="relative">
              <select
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full bg-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
              >
                <option value="">Please Select an Option</option>
                <option value="general">General Inquiry</option>
                <option value="support">Support</option>
                <option value="partnership">Partnership</option>
                <option value="other">Other</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="mb-4">
          </div>
          <div className="mb-4">
            <label
              htmlFor="company"
              className="block text-[#525659] text-sm font-semibold mb-2"
            >
              Your Company Name
            </label>
            <input
              type="text"
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Please Enter Your Company Name"
              className="w-full bg-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="where"
              className="block text-[#525659] text-sm font-semibold mb-2"
            >
              How Did You Hear About Us?
            </label>
            <input
              type="text"
              id="where"
              value={formData.where}
              onChange={(e) => setFormData({ ...formData, where: e.target.value })}
              placeholder="Please Enter"
              className="w-full bg-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-[#525659] text-sm font-semibold mb-2"
            >
              Your Corporate Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Please Enter Your Corporate Email Address"
              className="w-full bg-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <label
            htmlFor="email"
            className="block text-[#525659] text-sm font-semibold mb-2"
          >
            Contact Number
          </label>
          <div className="mb-4 flex gap-2">
            <div className="w-1/4 relative" ref={countryDropdownRef}>
              <div 
                className="flex items-center h-full gap-1 rounded-md p-3 focus-within:ring-2 focus-within:ring-blue-500 bg-white cursor-pointer"
                onClick={() => {
                  setShowCountryDropdown(!showCountryDropdown);
                  if (!showCountryDropdown) {
                    setCountrySearchTerm("");
                  }
                }}
              >
                <Image
                  src={`https://flagcdn.com/w20/${selectedCountry.countryCode}.png`}
                  alt={selectedCountry.name}
                  width={20}
                  height={15}
                  className="object-cover"
                />
                <span className="text-[#525659] text-[12px] ml-2">{selectedCountry.code}</span>
                <svg 
                  className={`w-4 h-4 ml-auto transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {showCountryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Search"
                      value={countrySearchTerm}
                      onChange={(e) => setCountrySearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="overflow-y-auto max-h-52">
                    {countries
                      .filter((country) => {
                        const searchLower = countrySearchTerm.toLowerCase();
                        return (
                          country.name.toLowerCase().includes(searchLower) ||
                          country.code.includes(countrySearchTerm)
                        );
                      })
                      .map((country) => (
                    <div
                      key={country.countryCode}
                      onClick={() => {
                        setSelectedCountry(country);
                        setShowCountryDropdown(false);
                        setCountrySearchTerm("");
                      }}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <Image
                        src={`https://flagcdn.com/w20/${country.countryCode}.png`}
                        alt={country.name}
                        width={20}
                        height={15}
                        className="object-cover"
                      />
                      <span className="text-[#525659] text-[12px]">{country.code}</span>
                    </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="w-3/4">
              <input
                type="text"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Please Enter Your Contact Number"
                className="w-full outline-none pl-2 rounded-md p-3 focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
          <div className="w-full">
            <label
              htmlFor="message"
              className="block text-[#525659] text-sm font-semibold mb-2"
            >
              Your Message
            </label>
            <textarea
              id="message"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Please Enter Your Message"
              className="w-full bg-white rounded-md p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="privacy"
                checked={privacyAccepted}
                disabled
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-not-allowed"
              />
              <label
                htmlFor="privacy"
                className="text-sm font-medium"
                style={{ color: "rgba(0, 0, 0, 0.65)" }}
              >
                I accept the{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  style={{ color: "#5563FF", textDecoration: "underline" }}
                  className="hover:opacity-80 transition-opacity bg-transparent border-none p-0 cursor-pointer"
                >
                  Privacy Policy and Personal Data Protection
                </button>
                .
              </label>
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="newsletter"
                checked={formData.newsletter}
                onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label
                htmlFor="newsletter"
                className="text-sm font-medium"
                style={{ color: "rgba(0, 0, 0, 0.65)" }}
              >
                Would you like to subscribe to our monthly newsletter?
              </label>
            </div>
          </div>

          {submitStatus.type && (
            <div
              className={`mb-4 p-3 rounded-md text-sm ${
                submitStatus.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {submitStatus.message}
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className={`text-white font-semibold px-8 py-3 rounded-md shadow transition w-full ${
              !isFormValid() || isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-90"
            }`}
            style={{
              background: "linear-gradient(to right, #1465FA, #0099FF)",
            }}
          >
            {isSubmitting ? "SENDING..." : "SUBMIT"}
          </button>
          </form>
        </motion.div>
        {/* Astronaut Image */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          viewport={{ once: true }}
          className={`relative w-full max-w-xl h-auto shrink-0 overflow-hidden rounded-xl flex items-center justify-center p-6 hidden md:flex md:mb-[40px] ${
            isContactPage ? "" : ""
          }`}
        >
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }} // zoom in & out
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
            className="absolute inset-0"
          >
            <Image
              src={getImagePath("/assets/images/contact_bg copy.png")}
              alt="Astronaut"
              fill
              className="rounded-xl object-fill"
            />
          </motion.div>

          <div
            className={`absolute inset-0 ml-10 flex items-end justify-start p-6 pb-8 text-white text-left text-center`}
          >
            <p
              className="text-sm font-inter font-[400] text-[16px]"
              style={{ fontStyle: "normal" }}
            >
              At the heart of ANDRON, every choice you make becomes a roadmap shaping your future.
              <br />
            </p>
          </div>
        </motion.div>
      </div>
      {/* Social Media Icons */}
      <div className="flex justify-center gap-6 mt-12">
        <Link
          href="#"
          className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
        >
          <Image
            src={getImagePath("/assets/icons/facebook.svg")}
            alt="Facebook"
            width={12}
            height={12}
          />
        </Link>
        <Link
          href="#"
          className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
        >
          <Image
            src={getImagePath("/assets/icons/instagram.svg")}
            alt="Instagram"
            width={24}
            height={24}
          />
        </Link>
        <Link
          href="#"
          className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
        >
          <Image
            src={getImagePath("/assets/icons/twitter.svg")}
            alt="Twitter"
            width={24}
            height={24}
          />
        </Link>
      </div>
    </section>
  );
};

export default ContactForm;
